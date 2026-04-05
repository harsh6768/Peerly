import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, Prisma, VerificationType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { isAdminEmail } from '../../common/admin-access';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseGoogleLoginDto } from './dto/supabase-google-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AuthenticatedSession, AuthenticatedUser } from './auth.types';

type SupabaseUserResponse = {
  id: string;
  email?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
};

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  authProvider: true,
  isVerified: true,
  verificationType: true,
  verificationStatus: true,
  workEmail: true,
  companyName: true,
  linkedinUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  private readonly sessionTtlMs = 1000 * 60 * 60 * 24 * 30;

  constructor(private readonly prisma: PrismaService) {}

  async loginWithSupabaseGoogle(dto: SupabaseGoogleLoginDto) {
    const supabaseUser = await this.fetchSupabaseUser(dto.accessToken);
    const isGoogleProvider =
      supabaseUser.app_metadata?.provider === 'google' ||
      supabaseUser.app_metadata?.providers?.includes('google');

    if (!isGoogleProvider) {
      throw new UnauthorizedException('The Supabase session is not backed by Google OAuth.');
    }

    const email = supabaseUser.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Supabase did not return a valid email for this user.');
    }

    const name =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      dto.fallbackName ||
      email.split('@')[0];

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleSub: supabaseUser.id }, { email }],
      },
      select: userSelect,
    });

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email,
            fullName: name,
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            authProvider: AuthProvider.GOOGLE,
            googleSub: supabaseUser.id,
            isActive: true,
          },
          select: userSelect,
        })
      : await this.prisma.user.create({
          data: {
            email,
            fullName: name,
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            authProvider: AuthProvider.GOOGLE,
            googleSub: supabaseUser.id,
          },
          select: userSelect,
        });

    await this.prisma.verificationProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken: this.generateSessionToken(),
        provider: AuthProvider.GOOGLE,
        expiresAt: new Date(Date.now() + this.sessionTtlMs),
      },
    });

    return {
      session: {
        token: session.sessionToken,
        expiresAt: session.expiresAt,
      },
      user: this.serializeUser(user),
      onboarding: {
        prompt: 'Get verified to increase trust and visibility',
        recommendedVerificationMethod: VerificationType.WORK_EMAIL,
      },
    };
  }

  async getAuthenticatedSession(token: string): Promise<AuthenticatedSession> {
    const session = await this.prisma.authSession.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedException('Session has expired.');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return {
      token: session.sessionToken,
      expiresAt: session.expiresAt,
      user: this.serializeUser(session.user),
    };
  }

  async logout(token: string) {
    await this.prisma.authSession.deleteMany({
      where: { sessionToken: token },
    });

    return { success: true };
  }

  async updateProfile(session: AuthenticatedSession, dto: UpdateProfileDto) {
    const phone = dto.phone?.trim();

    const user = await this.prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: phone ? phone : null,
      },
      select: userSelect,
    });

    return this.serializeUser(user);
  }

  private async fetchSupabaseUser(accessToken: string) {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new InternalServerErrorException(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be configured on the backend.',
      );
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unable to verify the Supabase access token.');
    }

    return (await response.json()) as SupabaseUserResponse;
  }

  private generateSessionToken() {
    return `${randomUUID()}-${randomUUID()}`;
  }

  private serializeUser(user: Prisma.UserGetPayload<{ select: typeof userSelect }>): AuthenticatedUser {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      isAdmin: isAdminEmail(user.email),
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      isVerified: user.isVerified,
      verificationType: user.verificationType,
      verificationStatus: user.verificationStatus,
      workEmail: user.workEmail,
      companyName: user.companyName,
      linkedinUrl: user.linkedinUrl,
      createdAt: user.createdAt,
    };
  }
}
