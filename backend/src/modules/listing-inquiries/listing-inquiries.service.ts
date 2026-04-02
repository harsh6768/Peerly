import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationType,
  ListingInquiryStatus,
  ListingStatus,
  ListingType,
  MessageType,
  Prisma,
} from '@prisma/client';

import { listingInclude, toOptionalDate } from '../../common/query-helpers';
import type { AuthenticatedSession } from '../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingInquiryDto } from './dto/create-listing-inquiry.dto';
import { UpdateListingInquiryStatusDto } from './dto/update-listing-inquiry-status.dto';

const inquiryUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  homeCity: true,
  isVerified: true,
  verificationType: true,
  verificationStatus: true,
  companyName: true,
} as const;

const inquiryInclude = {
  listing: {
    include: listingInclude,
  },
  requester: {
    select: inquiryUserSelect,
  },
  listingOwner: {
    select: inquiryUserSelect,
  },
  conversation: {
    include: {
      participants: {
        include: {
          user: {
            select: inquiryUserSelect,
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
      messages: {
        include: {
          sender: {
            select: inquiryUserSelect,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  },
} as const;

type InquiryScope = 'owner' | 'requester';

@Injectable()
export class ListingInquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForSession(
    session: AuthenticatedSession,
    scope: InquiryScope = 'requester',
    status?: ListingInquiryStatus,
    listingId?: string,
  ) {
    return this.prisma.listingInquiry.findMany({
      where: {
        ...(scope === 'owner'
          ? { listingOwnerUserId: session.user.id }
          : { requesterUserId: session.user.id }),
        ...(status ? { status } : {}),
        ...(listingId ? { listingId } : {}),
      },
      include: inquiryInclude,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findByIdForSession(id: string, session: AuthenticatedSession) {
    const inquiry = await this.prisma.listingInquiry.findUnique({
      where: { id },
      include: inquiryInclude,
    });

    if (!inquiry) {
      throw new NotFoundException(`Listing inquiry with id "${id}" was not found.`);
    }

    if (
      inquiry.requesterUserId !== session.user.id &&
      inquiry.listingOwnerUserId !== session.user.id
    ) {
      throw new ForbiddenException('You cannot access this listing inquiry.');
    }

    return inquiry;
  }

  async create(session: AuthenticatedSession, dto: CreateListingInquiryDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        title: true,
        ownerUserId: true,
        status: true,
        type: true,
      },
    });

    if (!listing || listing.type !== ListingType.tenant_replacement) {
      throw new NotFoundException(`Listing with id "${dto.listingId}" was not found.`);
    }

    if (listing.status !== ListingStatus.PUBLISHED) {
      throw new BadRequestException('Only published listings can receive inquiries.');
    }

    if (listing.ownerUserId === session.user.id) {
      throw new BadRequestException('You cannot send an inquiry to your own listing.');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
      },
    });

    if (!requester?.phone?.trim()) {
      throw new BadRequestException('Add your phone number in profile before sending an inquiry.');
    }

    const existingInquiry = await this.prisma.listingInquiry.findFirst({
      where: {
        listingId: dto.listingId,
        requesterUserId: session.user.id,
        status: {
          in: [
            ListingInquiryStatus.NEW,
            ListingInquiryStatus.CONTACTED,
            ListingInquiryStatus.SCHEDULED,
          ],
        },
      },
    });

    if (existingInquiry) {
      throw new ConflictException('You already have an active inquiry for this listing.');
    }

    const trimmedMessage = trimToOptional(dto.message);
    const trimmedVisitNote = trimToOptional(dto.preferredVisitNote);

    return this.prisma.listingInquiry.create({
      data: {
        listingId: dto.listingId,
        requesterUserId: session.user.id,
        listingOwnerUserId: listing.ownerUserId,
        message: trimmedMessage,
        budgetAmount: dto.budgetAmount,
        preferredMoveInDate: toOptionalDate(dto.preferredMoveInDate),
        preferredOccupancy: dto.preferredOccupancy,
        preferredVisitAt: toOptionalDate(dto.preferredVisitAt),
        preferredVisitNote: trimmedVisitNote,
        conversation: {
          create: {
            conversationType: ConversationType.LISTING,
            createdByUserId: session.user.id,
            participants: {
              create: [
                { userId: session.user.id },
                { userId: listing.ownerUserId },
              ],
            },
            messages: {
              create: this.buildInquiryMessages(session, listing.title, trimmedMessage),
            },
          },
        },
      },
      include: inquiryInclude,
    });
  }

  async updateStatus(
    id: string,
    session: AuthenticatedSession,
    dto: UpdateListingInquiryStatusDto,
  ) {
    const inquiry = await this.findByIdForSession(id, session);

    if (inquiry.listingOwnerUserId !== session.user.id) {
      throw new ForbiddenException('Only the listing owner can update inquiry statuses.');
    }

    if (dto.status === ListingInquiryStatus.SCHEDULED && !dto.scheduledVisitAt) {
      throw new BadRequestException('A scheduled visit time is required when marking an inquiry as scheduled.');
    }

    const statusMessage = this.buildStatusUpdateMessage(
      dto.status,
      dto.scheduledVisitAt ? new Date(dto.scheduledVisitAt) : undefined,
      trimToOptional(dto.scheduledVisitNote),
    );

    await this.prisma.listingInquiry.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.scheduledVisitAt
          ? { scheduledVisitAt: new Date(dto.scheduledVisitAt) }
          : {}),
        ...(dto.scheduledVisitNote !== undefined
          ? { scheduledVisitNote: trimToNullable(dto.scheduledVisitNote) }
          : {}),
        ...(statusMessage && inquiry.conversation
          ? {
              conversation: {
                update: {
                  messages: {
                    create: {
                      body: statusMessage,
                      messageType: MessageType.SYSTEM,
                    },
                  },
                },
              },
            }
          : {}),
      },
    });

    return this.findByIdForSession(id, session);
  }

  private buildInquiryMessages(
    session: AuthenticatedSession,
    listingTitle: string,
    message?: string,
  ): Prisma.MessageCreateWithoutConversationInput[] {
    return [
      {
        body: `${session.user.name} sent an inquiry for ${listingTitle}.`,
        messageType: MessageType.SYSTEM,
      },
      ...(message
        ? [
            {
              body: message,
              messageType: MessageType.TEXT,
              sender: {
                connect: {
                  id: session.user.id,
                },
              },
            },
          ]
        : []),
    ];
  }

  private buildStatusUpdateMessage(
    status: ListingInquiryStatus,
    scheduledVisitAt?: Date,
    scheduledVisitNote?: string,
  ) {
    switch (status) {
      case ListingInquiryStatus.CONTACTED:
        return 'The owner marked this inquiry as contacted.';
      case ListingInquiryStatus.SCHEDULED:
        return `Visit scheduled for ${formatSystemDate(scheduledVisitAt)}${scheduledVisitNote ? `. ${scheduledVisitNote}` : ''}`;
      case ListingInquiryStatus.DECLINED:
        return 'The owner declined this inquiry.';
      case ListingInquiryStatus.CLOSED:
        return 'The owner closed this inquiry.';
      default:
        return undefined;
    }
  }
}

function trimToOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function trimToNullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatSystemDate(value?: Date) {
  if (!value || Number.isNaN(value.getTime())) {
    return 'the selected time';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}
