import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VerificationBadge, VerificationStatus, VerificationType } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { ConfirmWorkEmailOtpDto } from './dto/confirm-work-email-otp.dto';
import { RequestWorkEmailOtpDto } from './dto/request-work-email-otp.dto';
import { ResendEmailService } from './resend-email.service';
import { ReviewLinkedinVerificationDto } from './dto/review-linkedin-verification.dto';
import { SubmitLinkedinVerificationDto } from './dto/submit-linkedin-verification.dto';

const blockedDomains = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']);

const userSummarySelect = {
  id: true,
  fullName: true,
  email: true,
  isVerified: true,
  verificationType: true,
  verificationStatus: true,
  workEmail: true,
  companyName: true,
  linkedinUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resendEmailService: ResendEmailService,
  ) {}

  async getMyVerificationStatus(session: AuthenticatedSession) {
    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: userSummarySelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      user: this.serializeVerificationSummary(user),
      incentives: [
        'Higher ranking in listings',
        'Increased visibility',
        'Trust badge display',
        'Better response rate',
      ],
      availableMethods: [
        {
          type: VerificationType.WORK_EMAIL,
          recommended: true,
          label: 'Verify with Work Email',
        },
        {
          type: VerificationType.LINKEDIN,
          recommended: false,
          label: 'Verify with LinkedIn',
        },
      ],
    };
  }

  async requestWorkEmailOtp(session: AuthenticatedSession, dto: RequestWorkEmailOtpDto) {
    const workEmail = dto.workEmail.trim().toLowerCase();
    const domain = this.extractDomain(workEmail);

    if (blockedDomains.has(domain)) {
      throw new BadRequestException('Please use a work email instead of a public email domain.');
    }

    const recentRequestCount = await this.prisma.workEmailOtp.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 15),
        },
      },
    });

    if (recentRequestCount >= 3) {
      throw new HttpException(
        'Too many verification requests. Please wait 15 minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const lastRequest = await this.prisma.workEmailOtp.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastRequest && Date.now() - lastRequest.createdAt.getTime() < 1000 * 60) {
      throw new HttpException(
        'Please wait at least 60 seconds before requesting a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.workEmailOtp.updateMany({
      where: {
        userId: session.user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const otp = this.generateOtp();

    const otpRecord = await this.prisma.workEmailOtp.create({
      data: {
        userId: session.user.id,
        workEmail,
        otpHash: this.hashOtp(otp),
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      },
    });

    let deliveryResult: Awaited<ReturnType<ResendEmailService['sendWorkEmailOtp']>>;

    try {
      deliveryResult = await this.resendEmailService.sendWorkEmailOtp({
        otp,
        to: workEmail,
        recipientName: session.user.name,
        companyName: this.companyNameFromDomain(domain),
        expiresInMinutes: 5,
      });
    } catch (error) {
      await this.prisma.workEmailOtp.deleteMany({
        where: {
          id: otpRecord.id,
        },
      });

      throw error;
    }

    return {
      success: true,
      delivery: {
        channel: 'email',
        provider: deliveryResult.provider,
        destination: this.maskEmail(workEmail),
        expiresInMinutes: 5,
      },
      companyName: this.companyNameFromDomain(domain),
      otpPreview: process.env.NODE_ENV === 'production' ? undefined : otp,
    };
  }

  async confirmWorkEmailOtp(session: AuthenticatedSession, dto: ConfirmWorkEmailOtpDto) {
    const workEmail = dto.workEmail.trim().toLowerCase();
    const otpRecord = await this.prisma.workEmailOtp.findFirst({
      where: {
        userId: session.user.id,
        workEmail,
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new NotFoundException('No active OTP was found for this work email.');
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This OTP has expired. Please request a new one.');
    }

    if (otpRecord.attemptCount >= otpRecord.maxAttempts) {
      throw new BadRequestException('Maximum OTP attempts reached. Please request a new OTP.');
    }

    if (otpRecord.otpHash !== this.hashOtp(dto.otp)) {
      await this.prisma.workEmailOtp.update({
        where: { id: otpRecord.id },
        data: {
          attemptCount: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Invalid OTP.');
    }

    const companyName = this.companyNameFromDomain(this.extractDomain(workEmail));

    await this.prisma.$transaction([
      this.prisma.workEmailOtp.update({
        where: { id: otpRecord.id },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: session.user.id },
        data: {
          isVerified: true,
          verificationType: VerificationType.WORK_EMAIL,
          verificationStatus: VerificationStatus.APPROVED,
          workEmail,
          companyName,
        },
      }),
      this.prisma.verificationProfile.upsert({
        where: { userId: session.user.id },
        update: {
          companyEmailVerified: true,
          verificationBadge: VerificationBadge.COMPANY_VERIFIED,
          trustScore: 88,
          lastVerifiedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          companyEmailVerified: true,
          verificationBadge: VerificationBadge.COMPANY_VERIFIED,
          trustScore: 88,
          lastVerifiedAt: new Date(),
        },
      }),
    ]);

    return this.getMyVerificationStatus(session);
  }

  async submitLinkedinVerification(session: AuthenticatedSession, dto: SubmitLinkedinVerificationDto) {
    const linkedinUrl = dto.linkedinUrl.trim();
    this.assertLinkedinUrl(linkedinUrl);

    await this.prisma.user.update({
      where: { id: session.user.id },
      data: {
        linkedinUrl,
        verificationType: VerificationType.LINKEDIN,
        verificationStatus: VerificationStatus.PENDING,
        isVerified: false,
      },
    });

    await this.prisma.verificationProfile.upsert({
      where: { userId: session.user.id },
      update: {
        linkedinVerified: false,
        verificationBadge: VerificationBadge.NONE,
      },
      create: {
        userId: session.user.id,
        linkedinVerified: false,
        verificationBadge: VerificationBadge.NONE,
      },
    });

    return {
      success: true,
      verificationStatus: VerificationStatus.PENDING,
      verificationType: VerificationType.LINKEDIN,
      linkedinUrl,
      proofCode: dto.proofCode ?? null,
      message: 'LinkedIn verification submitted for manual review.',
    };
  }

  async cancelLinkedinVerification(session: AuthenticatedSession) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: userSummarySelect,
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    if (existingUser.verificationType !== VerificationType.LINKEDIN) {
      throw new BadRequestException('There is no active LinkedIn verification to cancel.');
    }

    if (existingUser.isVerified) {
      throw new BadRequestException(
        'Approved LinkedIn verification cannot be canceled here. Verify with work email if you want to switch methods later.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: session.user.id },
        data: {
          linkedinUrl: null,
          verificationType: null,
          verificationStatus: null,
          isVerified: false,
        },
      }),
      this.prisma.verificationProfile.upsert({
        where: { userId: session.user.id },
        update: {
          linkedinVerified: false,
          verificationBadge: VerificationBadge.NONE,
          trustScore: 0,
          lastVerifiedAt: null,
        },
        create: {
          userId: session.user.id,
          linkedinVerified: false,
          verificationBadge: VerificationBadge.NONE,
          trustScore: 0,
          lastVerifiedAt: null,
        },
      }),
    ]);

    return {
      success: true,
      message: 'LinkedIn verification was canceled. You can now verify with work email instead.',
    };
  }

  async reviewLinkedinVerification(dto: ReviewLinkedinVerificationDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: userSummarySelect,
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    const approved = dto.status === VerificationStatus.APPROVED;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: dto.userId },
        data: {
          verificationType: VerificationType.LINKEDIN,
          verificationStatus: dto.status,
          isVerified: approved,
        },
      }),
      this.prisma.verificationProfile.upsert({
        where: { userId: dto.userId },
        update: {
          linkedinVerified: approved,
          verificationBadge: approved ? VerificationBadge.LINKEDIN_VERIFIED : VerificationBadge.NONE,
          trustScore: approved ? 74 : 20,
          lastVerifiedAt: approved ? new Date() : null,
        },
        create: {
          userId: dto.userId,
          linkedinVerified: approved,
          verificationBadge: approved ? VerificationBadge.LINKEDIN_VERIFIED : VerificationBadge.NONE,
          trustScore: approved ? 74 : 20,
          lastVerifiedAt: approved ? new Date() : null,
        },
      }),
    ]);

    return {
      success: true,
      userId: dto.userId,
      status: dto.status,
      reviewNotes: dto.reviewNotes ?? null,
    };
  }

  async getVerificationMetrics() {
    const [totalUsers, verifiedUsers, pendingLinkedinReviews, boostedListings, publishedListings] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            isVerified: true,
          },
        }),
        this.prisma.user.count({
          where: {
            verificationType: VerificationType.LINKEDIN,
            verificationStatus: VerificationStatus.PENDING,
          },
        }),
        this.prisma.listing.count({
          where: {
            isBoosted: true,
          },
        }),
        this.prisma.listing.count(),
      ]);

    return {
      totalUsers,
      verifiedUsers,
      verificationRate: totalUsers === 0 ? 0 : Number(((verifiedUsers / totalUsers) * 100).toFixed(1)),
      pendingLinkedinReviews,
      boostedListings,
      publishedListings,
      trackedMetrics: [
        '% of users verified',
        'Conversion rate (basic to verified)',
        'Engagement difference (verified vs non-verified)',
        'Listing success rate',
      ],
    };
  }

  private extractDomain(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
      throw new BadRequestException('A valid work email is required.');
    }

    return domain;
  }

  private companyNameFromDomain(domain: string) {
    return domain
      .split('.')
      .slice(0, -1)
      .join(' ')
      .split(/[-_]/g)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private generateOtp() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private hashOtp(otp: string) {
    return createHash('sha256').update(otp).digest('hex');
  }

  private maskEmail(email: string) {
    const [localPart, domain] = email.split('@');
    const visible = localPart.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
  }

  private assertLinkedinUrl(linkedinUrl: string) {
    const url = new URL(linkedinUrl);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();

    if (hostname !== 'linkedin.com') {
      throw new BadRequestException('Please enter a valid LinkedIn profile URL.');
    }
  }

  private serializeVerificationSummary(
    user: Prisma.UserGetPayload<{ select: typeof userSummarySelect }>,
  ) {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      isVerified: user.isVerified,
      verificationType: user.verificationType,
      verificationStatus: user.verificationStatus,
      workEmail: user.workEmail,
      companyName: user.companyName,
      linkedinUrl: user.linkedinUrl,
      createdAt: user.createdAt,
      statusLabel: user.isVerified
        ? 'Verified'
        : user.verificationStatus === VerificationStatus.PENDING
          ? 'Pending verification'
          : 'Not verified',
      badges: [
        user.isVerified ? 'Verified Professional' : null,
        user.companyName ? `Company: ${user.companyName}` : null,
        user.linkedinUrl ? 'LinkedIn' : null,
      ].filter(Boolean),
    };
  }
}
