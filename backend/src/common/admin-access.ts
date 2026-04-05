import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedSession } from '../modules/auth/auth.types';

export function isAdminEmail(email: string) {
  const configuredEmails = process.env.ADMIN_EMAILS
    ?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!configuredEmails?.length) {
    return false;
  }

  return configuredEmails.includes(email.trim().toLowerCase());
}

export function assertAdminSession(session: AuthenticatedSession) {
  if (!isAdminEmail(session.user.email)) {
    throw new ForbiddenException('You do not have access to moderation tools.');
  }
}
