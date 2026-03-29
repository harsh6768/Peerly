import { AuthProvider, VerificationStatus, VerificationType } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  isVerified: boolean;
  verificationType: VerificationType | null;
  verificationStatus: VerificationStatus | null;
  workEmail: string | null;
  companyName: string | null;
  linkedinUrl: string | null;
  createdAt: Date;
};

export type AuthenticatedSession = {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

