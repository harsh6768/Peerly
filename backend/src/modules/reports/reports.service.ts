import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityType,
  ListingStatus,
  ListingType,
  Prisma,
  ReportStatus,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

import { assertAdminSession } from '../../common/admin-access';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

const reportReporterSelect = {
  id: true,
  fullName: true,
  email: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: AuthenticatedSession, dto: CreateReportDto) {
    if (dto.entityType !== EntityType.LISTING && dto.entityType !== EntityType.USER) {
      throw new BadRequestException('Only listing and user reports are supported in the current MVP.');
    }

    await this.assertSupportedEntity(session, dto.entityType, dto.entityId);

    const existingOpenReport = await this.prisma.report.findFirst({
      where: {
        reportedByUserId: session.user.id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        status: ReportStatus.OPEN,
      },
    });

    if (existingOpenReport) {
      throw new BadRequestException('You already have an open report for this item.');
    }

    return this.prisma.report.create({
      data: {
        reportedByUserId: session.user.id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        reason: dto.reason,
        notes: dto.notes?.trim() || undefined,
      },
      include: {
        reportedBy: {
          select: reportReporterSelect,
        },
      },
    });
  }

  async getModerationQueue(session: AuthenticatedSession, status?: ReportStatus) {
    assertAdminSession(session);

    const reports = await this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reportedBy: {
          select: reportReporterSelect,
        },
        reviewedBy: {
          select: reportReporterSelect,
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    const listingIds = reports
      .filter((report) => report.entityType === EntityType.LISTING)
      .map((report) => report.entityId);
    const userIds = reports
      .filter((report) => report.entityType === EntityType.USER)
      .map((report) => report.entityId);

    const [listings, users, pendingLinkedinReviews] = await Promise.all([
      listingIds.length
        ? this.prisma.listing.findMany({
            where: {
              id: {
                in: listingIds,
              },
            },
            select: {
              id: true,
              title: true,
              city: true,
              locality: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              isActive: true,
              isVerified: true,
              verificationStatus: true,
              phoneVerifiedAt: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.user.findMany({
        where: {
          verificationType: VerificationType.LINKEDIN,
          verificationStatus: VerificationStatus.PENDING,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          linkedinUrl: true,
          linkedinProofCode: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const listingsById = new Map(listings.map((listing) => [listing.id, listing]));
    const usersById = new Map(users.map((user) => [user.id, user]));

    return {
      summary: {
        openReports: reports.filter((report) => report.status === ReportStatus.OPEN).length,
        reviewedReports: reports.filter((report) => report.status === ReportStatus.REVIEWED).length,
        actionedReports: reports.filter((report) => report.status === ReportStatus.ACTIONED).length,
        dismissedReports: reports.filter((report) => report.status === ReportStatus.DISMISSED).length,
        pendingLinkedinReviews: pendingLinkedinReviews.length,
      },
      reports: reports.map((report) => ({
        ...report,
        entity:
          report.entityType === EntityType.LISTING
            ? listingsById.get(report.entityId) ?? null
            : report.entityType === EntityType.USER
              ? usersById.get(report.entityId) ?? null
              : null,
      })),
      pendingLinkedinReviews,
    };
  }

  async reviewReport(
    id: string,
    session: AuthenticatedSession,
    dto: ReviewReportDto,
  ) {
    assertAdminSession(session);

    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.entityAction === 'ARCHIVE_LISTING' && report.entityType === EntityType.LISTING) {
        await tx.listing.update({
          where: { id: report.entityId },
          data: {
            status: ListingStatus.ARCHIVED,
          },
        });
      }

      if (dto.entityAction === 'DEACTIVATE_USER' && report.entityType === EntityType.USER) {
        await tx.user.update({
          where: { id: report.entityId },
          data: {
            isActive: false,
          },
        });
      }

      if (dto.entityAction === 'REACTIVATE_USER' && report.entityType === EntityType.USER) {
        await tx.user.update({
          where: { id: report.entityId },
          data: {
            isActive: true,
          },
        });
      }

      return tx.report.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedByUserId: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes?.trim() || null,
        },
        include: {
          reportedBy: {
            select: reportReporterSelect,
          },
          reviewedBy: {
            select: reportReporterSelect,
          },
        },
      });
    });
  }

  private async assertSupportedEntity(
    session: AuthenticatedSession,
    entityType: EntityType,
    entityId: string,
  ) {
    if (entityType === EntityType.LISTING) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          ownerUserId: true,
          type: true,
        },
      });

      if (!listing || listing.type !== ListingType.tenant_replacement) {
        throw new NotFoundException('Listing not found.');
      }

      if (listing.ownerUserId === session.user.id) {
        throw new BadRequestException('You cannot report your own listing.');
      }

      return;
    }

    if (entityType === EntityType.USER) {
      const user = await this.prisma.user.findUnique({
        where: { id: entityId },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      if (user.id === session.user.id) {
        throw new BadRequestException('You cannot report yourself.');
      }
    }
  }
}
