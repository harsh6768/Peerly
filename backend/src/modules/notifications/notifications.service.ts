import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserNotificationType } from '@prisma/client';

import type { AuthenticatedSession } from '../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationPayload = {
  title: string;
  /** Drives client routing: host vs seeker inquiry detail */
  audience: 'owner' | 'seeker';
  listingId?: string;
  inquiryId?: string;
  listingTitle?: string;
  status?: string;
  visitAction?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(
    userId: string,
    type: UserNotificationType,
    payload: NotificationPayload,
    dedupeKey?: string,
  ) {
    try {
      return await this.prisma.userNotification.create({
        data: {
          userId,
          type,
          payload: payload as Prisma.InputJsonValue,
          ...(dedupeKey ? { dedupeKey } : {}),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        dedupeKey
      ) {
        return null;
      }
      throw err;
    }
  }

  async listForSession(session: AuthenticatedSession, cursor?: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const userId = session.user.id;

    let cursorRow: { id: string; createdAt: Date } | null = null;
    if (cursor) {
      cursorRow = await this.prisma.userNotification.findFirst({
        where: { id: cursor, userId },
        select: { id: true, createdAt: true },
      });
      if (!cursorRow) {
        throw new BadRequestException('Invalid notification cursor.');
      }
    }

    const items = await this.prisma.userNotification.findMany({
      where: {
        userId,
        ...(cursorRow
          ? {
              OR: [
                { createdAt: { lt: cursorRow.createdAt } },
                {
                  AND: [{ createdAt: cursorRow.createdAt }, { id: { lt: cursorRow.id } }],
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      select: {
        id: true,
        type: true,
        payload: true,
        readAt: true,
        createdAt: true,
      },
    });

    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    return {
      items: page.map((row) => ({
        id: row.id,
        type: row.type,
        payload: row.payload as NotificationPayload,
        readAt: row.readAt,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async unreadCountForSession(session: AuthenticatedSession) {
    const count = await this.prisma.userNotification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });
    return { unreadCount: count };
  }

  async markRead(session: AuthenticatedSession, id: string) {
    const row = await this.prisma.userNotification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!row) {
      throw new NotFoundException('Notification not found.');
    }
    if (row.readAt) {
      return { ok: true };
    }
    await this.prisma.userNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(session: AuthenticatedSession) {
    await this.prisma.userNotification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
