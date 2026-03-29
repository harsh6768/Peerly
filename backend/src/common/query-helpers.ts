// Shared helpers to keep service files closer to plain application code.

export const listInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      homeCity: true,
      isVerified: true,
      verificationType: true,
      verificationStatus: true,
      companyName: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      city: true,
      isVerifiedNetwork: true,
    },
  },
} as const;

export const listingInclude = {
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      homeCity: true,
      isVerified: true,
      verificationType: true,
      verificationStatus: true,
      companyName: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      city: true,
      isVerifiedNetwork: true,
    },
  },
} as const;

export function buildWhere(filters: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export function toRequiredDate(value: string) {
  return new Date(value);
}

export function toOptionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}
