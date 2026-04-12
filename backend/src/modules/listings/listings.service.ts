import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AssetProvider,
  HousingNeedStatus,
  ListingInquiryStatus,
  ListingStatus,
  ListingType,
  MessageType,
  Prisma,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

import {
  buildWhere,
  listingInclude,
  toOptionalDate,
  toRequiredDate,
} from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsQueryDto } from './dto/list-listings-query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

/** All new listing uploads use this Cloudinary public_id prefix (never `trusted-network`). */
const LISTING_CLOUD_FOLDER_ROOT = 'cirvo';

/** Legacy uploads still use this prefix; cleanup accepts both roots for the same user. */
const LEGACY_LISTING_CLOUD_FOLDER_ROOT = 'trusted-network';

function listingCloudFolderRoot(): string {
  return LISTING_CLOUD_FOLDER_ROOT;
}

type ListingMatchLabel = 'BEST_MATCH' | 'GOOD_MATCH' | 'POSSIBLE';
type ListingMatchSummary = {
  matchScore: number;
  qualityScore: number;
  finalScore: number;
  label: ListingMatchLabel;
  reasons: string[];
};

type ListingWithRelations = Prisma.ListingGetPayload<{
  include: typeof listingInclude;
}>;

export type ListingsPageResponse = {
  items: Array<
    ListingWithRelations & {
      matchSummary?: ListingMatchSummary;
    }
  >;
  nextCursor: string | null;
};

type HousingNeedForScoring = Prisma.HousingNeedGetPayload<{
  include: {
    nearbyPlaces: true;
  };
}>;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListListingsQueryDto, session?: AuthenticatedSession): Promise<ListingsPageResponse> {
    const listingType = query.type ?? ListingType.tenant_replacement;
    const ownerUserId = query.ownerUserId?.trim();

    if (ownerUserId) {
      return this.findAllForOwner(listingType, query);
    }

    return this.findAllPublicPaginated(listingType, query, session);
  }

  private async findAllForOwner(listingType: ListingType, query: ListListingsQueryDto): Promise<ListingsPageResponse> {
    const ownerUserId = query.ownerUserId!.trim();
    const trimmedNearby = query.nearby?.trim();
    const where: Prisma.ListingWhereInput = {
      type: listingType,
      ownerUserId,
      ...(query.status
        ? { status: query.status }
        : query.includeArchived
          ? {}
          : {
              status: {
                not: ListingStatus.ARCHIVED,
              },
            }),
      ...(query.city ? { city: query.city } : {}),
      ...(trimmedNearby
        ? {
            nearbyPlaces: {
              some: {
                name: trimmedNearby,
              },
            },
          }
        : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.occupancyType ? { occupancyType: query.occupancyType } : {}),
      ...((query.rentMin !== undefined || query.rentMax !== undefined)
        ? {
            rentAmount: {
              ...(query.rentMin !== undefined ? { gte: query.rentMin } : {}),
              ...(query.rentMax !== undefined ? { lte: query.rentMax } : {}),
            },
          }
        : {}),
    };

    const limit = Math.min(query.limit ?? 50, 50);

    let cursorRow: { id: string; createdAt: Date } | null = null;
    if (query.cursor) {
      cursorRow = await this.prisma.listing.findFirst({
        where: {
          id: query.cursor,
          ...where,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });
      if (!cursorRow) {
        throw new BadRequestException('Invalid listing cursor.');
      }
    }

    const pagedWhere: Prisma.ListingWhereInput =
      cursorRow
        ? {
            AND: [
              where,
              {
                OR: [
                  { createdAt: { lt: cursorRow.createdAt } },
                  {
                    AND: [{ createdAt: cursorRow.createdAt }, { id: { lt: cursorRow.id } }],
                  },
                ],
              },
            ],
          }
        : where;

    const rows = await this.prisma.listing.findMany({
      where: pagedWhere,
      include: listingInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    return { items: page, nextCursor };
  }

  private async findAllPublicPaginated(
    listingType: ListingType,
    query: ListListingsQueryDto,
    session?: AuthenticatedSession,
  ): Promise<ListingsPageResponse> {
    if (query.excludeOwnerUserId) {
      if (!session || session.user.id !== query.excludeOwnerUserId) {
        throw new ForbiddenException('excludeOwnerUserId is only allowed for your own user id.');
      }
    }

    const limit = Math.min(query.limit ?? 30, 50);
    const trimmedNearby = query.nearby?.trim();
    const statusFilter = query.status ?? ListingStatus.PUBLISHED;

    const where: Prisma.ListingWhereInput = {
      type: listingType,
      status: statusFilter,
      ...(query.city ? { city: query.city } : {}),
      ...(trimmedNearby
        ? {
            nearbyPlaces: {
              some: {
                name: trimmedNearby,
              },
            },
          }
        : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.occupancyType ? { occupancyType: query.occupancyType } : {}),
      ...((query.rentMin !== undefined || query.rentMax !== undefined)
        ? {
            rentAmount: {
              ...(query.rentMin !== undefined ? { gte: query.rentMin } : {}),
              ...(query.rentMax !== undefined ? { lte: query.rentMax } : {}),
            },
          }
        : {}),
      ...(query.excludeOwnerUserId
        ? {
            ownerUserId: {
              not: query.excludeOwnerUserId,
            },
          }
        : {}),
    };

    let cursorRow: { id: string; createdAt: Date } | null = null;
    if (query.cursor) {
      cursorRow = await this.prisma.listing.findFirst({
        where: {
          id: query.cursor,
          ...where,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });
      if (!cursorRow) {
        throw new BadRequestException('Invalid listing cursor.');
      }
    }

    const pagedWhere: Prisma.ListingWhereInput =
      cursorRow
        ? {
            AND: [
              where,
              {
                OR: [
                  { createdAt: { lt: cursorRow.createdAt } },
                  {
                    AND: [{ createdAt: cursorRow.createdAt }, { id: { lt: cursorRow.id } }],
                  },
                ],
              },
            ],
          }
        : where;

    const rows = await this.prisma.listing.findMany({
      where: pagedWhere,
      include: listingInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    const activeHousingNeed = session ? await this.findActiveHousingNeed(session.user.id) : null;

    if (!activeHousingNeed) {
      const sorted = [...page].sort((left, right) => {
        const rightScore = this.calculateGenericListingScore(right);
        const leftScore = this.calculateGenericListingScore(left);
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }
        return right.createdAt.getTime() - left.createdAt.getTime();
      });
      return { items: sorted, nextCursor };
    }

    const enriched = page.map((listing) => {
      const matchSummary = this.calculateListingMatchSummary(listing, activeHousingNeed);
      return {
        ...listing,
        matchSummary,
      };
    });

    const sorted = [...enriched].sort((left, right) => {
      if (right.matchSummary.finalScore !== left.matchSummary.finalScore) {
        return right.matchSummary.finalScore - left.matchSummary.finalScore;
      }
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    return { items: sorted, nextCursor };
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });

    if (!listing || listing.type !== ListingType.tenant_replacement) {
      throw new NotFoundException(`Listing with id "${id}" was not found.`);
    }

    return listing;
  }

  create(dto: CreateListingDto) {
    const listingType = dto.type ?? ListingType.tenant_replacement;
    const listingStatus = dto.status ?? ListingStatus.DRAFT;

    if (listingType !== ListingType.tenant_replacement) {
      throw new BadRequestException('Only tenant replacement listings are active in the current housing MVP.');
    }

    this.validateListingPayload(listingType, listingStatus, dto);

    return this.prisma.listing.create({
      data: {
        ownerUserId: dto.ownerUserId,
        organizationId: dto.organizationId,
        type: listingType,
        title: dto.title,
        description: dto.description?.trim() || undefined,
        city: dto.city?.trim(),
        locality: dto.locality?.trim(),
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        maintenanceAmount: dto.maintenanceAmount,
        miscCharges: dto.miscCharges?.trim() || undefined,
        amenities: this.normalizeAmenities(dto.amenities),
        propertyType: dto.propertyType,
        occupancyType: dto.occupancyType,
        moveInDate: dto.moveInDate ? toRequiredDate(dto.moveInDate) : undefined,
        moveOutDate: toOptionalDate(dto.moveOutDate),
        urgencyLevel: dto.urgencyLevel,
        contactMode: dto.contactMode,
        status: listingStatus,
        isBoosted: dto.isBoosted,
        brokerAllowed: dto.brokerAllowed,
        nearbyPlaces: dto.nearbyPlaces?.length
          ? {
              create: this.normalizeNearbyPlaces(dto.nearbyPlaces),
            }
          : undefined,
        images: dto.images?.length
          ? {
              create: this.normalizeListingImages(dto.images, listingType, listingStatus),
            }
          : undefined,
      },
      include: listingInclude,
    });
  }

  async update(id: string, dto: UpdateListingDto) {
    const existingListing = await this.findById(id);
    const listingType = dto.type ?? existingListing.type;
    const listingStatus = dto.status ?? existingListing.status;

    if (listingType !== ListingType.tenant_replacement) {
      throw new BadRequestException('Only tenant replacement listings are active in the current housing MVP.');
    }

    this.validateListingPayload(listingType, listingStatus, {
      title: dto.title ?? existingListing.title,
      contactPhone: dto.contactPhone ?? existingListing.contactPhone ?? undefined,
      city: dto.city ?? existingListing.city ?? undefined,
      locality: dto.locality ?? existingListing.locality ?? undefined,
      rentAmount: dto.rentAmount ?? existingListing.rentAmount ?? undefined,
      propertyType: dto.propertyType ?? existingListing.propertyType ?? undefined,
      occupancyType: dto.occupancyType ?? existingListing.occupancyType ?? undefined,
      moveInDate:
        dto.moveInDate ??
        (existingListing.moveInDate ? existingListing.moveInDate.toISOString() : undefined),
      images:
        dto.images ??
        existingListing.images.map((image) => ({
          assetProvider: image.assetProvider,
          providerAssetId: image.providerAssetId,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          bytes: image.bytes ?? undefined,
          isCover: image.isCover,
          sortOrder: image.sortOrder,
        })),
      nearbyPlaces:
        dto.nearbyPlaces ??
        existingListing.nearbyPlaces.map((place) => ({
          name: place.name,
          type: place.type,
        })),
    });

    const listingData = {
      ownerUserId: dto.ownerUserId,
      organizationId: dto.organizationId,
      type: dto.type,
      title: dto.title,
      description: dto.description?.trim(),
      city: dto.city?.trim() ?? (dto.city === null ? null : undefined),
      locality: dto.locality?.trim() ?? (dto.locality === null ? null : undefined),
      locationName: dto.locationName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      contactPhone: dto.contactPhone,
      rentAmount: dto.rentAmount,
      depositAmount: dto.depositAmount,
      maintenanceAmount: dto.maintenanceAmount,
      miscCharges: dto.miscCharges?.trim(),
      amenities: dto.amenities ? this.normalizeAmenities(dto.amenities) : undefined,
      propertyType: dto.propertyType,
      occupancyType: dto.occupancyType,
      ...(dto.moveInDate ? { moveInDate: toRequiredDate(dto.moveInDate) } : {}),
      ...(dto.moveOutDate !== undefined ? { moveOutDate: toOptionalDate(dto.moveOutDate) } : {}),
      urgencyLevel: dto.urgencyLevel,
      contactMode: dto.contactMode,
      status: listingStatus,
      isBoosted: dto.isBoosted,
      brokerAllowed: dto.brokerAllowed,
      ...(dto.nearbyPlaces !== undefined
        ? {
            nearbyPlaces: {
              deleteMany: {},
              ...(dto.nearbyPlaces.length
                ? {
                    create: this.normalizeNearbyPlaces(dto.nearbyPlaces),
                  }
                : {}),
            },
          }
        : {}),
      ...(dto.images
        ? {
            images: {
              deleteMany: {},
              create: this.normalizeListingImages(dto.images, listingType, listingStatus),
            },
          }
        : {}),
    } satisfies Parameters<typeof this.prisma.listing.update>[0]['data'];

    if (listingStatus !== ListingStatus.FILLED || existingListing.status === ListingStatus.FILLED) {
      return this.prisma.listing.update({
        where: { id },
        data: listingData,
        include: listingInclude,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedListing = await tx.listing.update({
        where: { id },
        data: listingData,
        include: listingInclude,
      });

      const activeInquiries = await tx.listingInquiry.findMany({
        where: {
          listingId: id,
          status: {
            in: [
              ListingInquiryStatus.NEW,
              ListingInquiryStatus.CONTACTED,
              ListingInquiryStatus.SCHEDULED,
            ],
          },
        },
        select: {
          id: true,
          conversation: {
            select: {
              id: true,
            },
          },
        },
      });

      if (activeInquiries.length > 0) {
        await tx.listingInquiry.updateMany({
          where: {
            id: {
              in: activeInquiries.map((inquiry) => inquiry.id),
            },
          },
          data: {
            status: ListingInquiryStatus.CLOSED,
          },
        });

        await Promise.all(
          activeInquiries
            .filter((inquiry) => inquiry.conversation?.id)
            .map((inquiry) =>
              tx.message.create({
                data: {
                  conversationId: inquiry.conversation!.id,
                  body: 'The listing was marked as rented, so this inquiry was closed automatically.',
                  messageType: MessageType.SYSTEM,
                },
              }),
            ),
        );
      }

      return updatedListing;
    });
  }

  async createSignedUploadSignature(userId: string, listingId?: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured on the backend.',
      );
    }

    const assetSlug = randomUUID();
    let publicId = `${LISTING_CLOUD_FOLDER_ROOT}/listings/${userId}/${assetSlug}`;

    if (listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: {
          id: listingId,
          ownerUserId: userId,
          type: ListingType.tenant_replacement,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!listing) {
        throw new NotFoundException(`Listing with id "${listingId}" was not found.`);
      }

      if (
        listing.status === ListingStatus.ARCHIVED ||
        listing.status === ListingStatus.FILLED
      ) {
        throw new BadRequestException('Images cannot be uploaded for archived or filled listings.');
      }

      publicId = `${LISTING_CLOUD_FOLDER_ROOT}/listings/${userId}/${listingId}/${assetSlug}`;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // Sign `public_id` + `timestamp` (alphabetical order per Cloudinary) so the asset path is fixed to cirvo/…
    const signature = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return {
      cloudName,
      apiKey,
      timestamp,
      publicId,
      signature,
    };
  }

  async cleanupUploadedImages(userId: string, assetIds: string[]) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured on the backend.',
      );
    }

    const currentRoot = listingCloudFolderRoot();
    const allowedPrefixes = [
      `${currentRoot}/listings/${userId}/`,
      `${LEGACY_LISTING_CLOUD_FOLDER_ROOT}/listings/${userId}/`,
    ];
    const invalidAssetIds = assetIds.filter(
      (assetId) => !allowedPrefixes.some((prefix) => assetId.startsWith(prefix)),
    );

    if (invalidAssetIds.length > 0) {
      throw new BadRequestException('One or more uploaded image ids do not belong to the current user.');
    }

    const results = await Promise.all(
      assetIds.map(async (assetId) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = createHash('sha1')
          .update(`invalidate=true&public_id=${assetId}&timestamp=${timestamp}${apiSecret}`)
          .digest('hex');

        const body = new URLSearchParams({
          public_id: assetId,
          api_key: apiKey,
          timestamp: String(timestamp),
          invalidate: 'true',
          signature,
        });

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });

        if (!response.ok) {
          throw new InternalServerErrorException(`Failed to clean up uploaded image "${assetId}".`);
        }

        const payload = (await response.json()) as { result?: string };
        return {
          assetId,
          result: payload.result ?? 'unknown',
        };
      }),
    );

    return {
      cleanedUp: results.length,
      results,
    };
  }

  private async findActiveHousingNeed(userId: string): Promise<HousingNeedForScoring | null> {
    return this.prisma.housingNeed.findFirst({
      where: {
        userId,
        status: {
          in: [HousingNeedStatus.OPEN, HousingNeedStatus.MATCHED],
        },
      },
      include: {
        nearbyPlaces: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
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

  private calculateListingMatchSummary(
    listing: ListingWithRelations,
    housingNeed: HousingNeedForScoring,
  ): ListingMatchSummary {
    let matchScore = 0;
    const scoredReasons: Array<{ label: string; score: number }> = [];

    if (this.normalizeMatchValue(listing.city) === this.normalizeMatchValue(housingNeed.city)) {
      matchScore += 22;
      scoredReasons.push({ label: `City match: ${housingNeed.city}`, score: 22 });
    }

    if (
      this.normalizeMatchValue(listing.locality) &&
      this.normalizeMatchValue(listing.locality) === this.normalizeMatchValue(housingNeed.locality)
    ) {
      matchScore += 16;
      scoredReasons.push({ label: `Locality match: ${listing.locality}`, score: 16 });
    }

    if (
      this.normalizeMatchValue(listing.propertyType) ===
      this.normalizeMatchValue(housingNeed.preferredPropertyType)
    ) {
      matchScore += 10;
      scoredReasons.push({
        label: `Property type: ${this.humanizeEnum(housingNeed.preferredPropertyType)}`,
        score: 10,
      });
    }

    if (
      this.normalizeMatchValue(listing.occupancyType) ===
      this.normalizeMatchValue(housingNeed.preferredOccupancy)
    ) {
      matchScore += 10;
      scoredReasons.push({
        label: `Occupancy: ${this.humanizeEnum(housingNeed.preferredOccupancy)}`,
        score: 10,
      });
    }

    const rentScore = this.scoreBudgetAlignment(listing.rentAmount, housingNeed.maxRentAmount, 12);
    if (rentScore > 0) {
      matchScore += rentScore;
      scoredReasons.push({
        label:
          rentScore >= 12
            ? 'Within rent budget'
            : rentScore >= 6
              ? 'Close to rent budget'
              : 'Slightly above rent budget',
        score: rentScore,
      });
    }

    const depositScore = this.scoreBudgetAlignment(listing.depositAmount, housingNeed.maxDepositAmount, 6);
    if (depositScore > 0) {
      matchScore += depositScore;
      scoredReasons.push({
        label: depositScore >= 6 ? 'Deposit fits' : 'Deposit is close',
        score: depositScore,
      });
    }

    const maintenanceScore = this.scoreBudgetAlignment(
      listing.maintenanceAmount,
      housingNeed.maxMaintenanceAmount,
      4,
    );
    if (maintenanceScore > 0) {
      matchScore += maintenanceScore;
      scoredReasons.push({
        label: maintenanceScore >= 4 ? 'Maintenance fits' : 'Maintenance is close',
        score: maintenanceScore,
      });
    }

    const moveInScore = this.scoreMoveInAlignment(listing.moveInDate, housingNeed.moveInDate, 10);
    if (moveInScore > 0) {
      matchScore += moveInScore;
      scoredReasons.push({
        label:
          moveInScore >= 10
            ? 'Move-in lines up well'
            : moveInScore >= 6
              ? 'Move-in is close'
              : 'Move-in could work',
        score: moveInScore,
      });
    }

    const amenityMatches = housingNeed.preferredAmenities.filter((amenity) =>
      listing.amenities.some(
        (listingAmenity) =>
          this.normalizeMatchValue(listingAmenity) === this.normalizeMatchValue(amenity),
      ),
    );
    const nearbyPlaceMatches = housingNeed.nearbyPlaces.filter((place) =>
      listing.nearbyPlaces.some(
        (listingPlace) =>
          this.normalizeMatchValue(listingPlace.name) === this.normalizeMatchValue(place.name) &&
          listingPlace.type === place.type,
      ),
    );

    const amenityScore = this.scorePreferenceOverlap(
      amenityMatches.length,
      housingNeed.preferredAmenities.length,
      8,
    );
    if (amenityScore > 0) {
      matchScore += amenityScore;
      scoredReasons.push({
        label:
          amenityMatches.length === 1 ? '1 amenity match' : `${amenityMatches.length} amenity matches`,
        score: amenityScore,
      });
    }

    const nearbyScore = this.scorePreferenceOverlap(
      nearbyPlaceMatches.length,
      housingNeed.nearbyPlaces.length,
      8,
    );
    if (nearbyScore > 0) {
      matchScore += nearbyScore;
      scoredReasons.push({
        label:
          nearbyPlaceMatches.length === 1
            ? 'Near 1 preferred workplace'
            : `Near ${nearbyPlaceMatches.length} preferred workplaces`,
        score: nearbyScore,
      });
    }

    const qualityScore = this.calculateListingQualityScore(listing);
    const finalScore = this.roundScore(matchScore * 0.82 + qualityScore * 0.18);
    const reasons = scoredReasons
      .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
      .slice(0, 3)
      .map((reason) => reason.label);

    return {
      matchScore: this.roundScore(matchScore),
      qualityScore: this.roundScore(qualityScore),
      finalScore,
      label: finalScore >= 78 ? 'BEST_MATCH' : finalScore >= 58 ? 'GOOD_MATCH' : 'POSSIBLE',
      reasons,
    };
  }

  private calculateGenericListingScore(listing: ListingWithRelations) {
    return this.roundScore(this.calculateListingQualityScore(listing) + (listing.isBoosted ? 8 : 0));
  }

  private calculateListingQualityScore(listing: ListingWithRelations) {
    const description = typeof listing.description === 'string' ? listing.description.trim() : '';

    return (
      (listing.images.length >= 3 ? 8 : listing.images.length > 0 ? 5 : 0) +
      (description.length >= 80 ? 6 : description.length > 0 ? 3 : 0) +
      (listing.amenities.length >= 4 ? 4 : listing.amenities.length > 0 ? 2 : 0) +
      (listing.nearbyPlaces.length >= 2 ? 3 : listing.nearbyPlaces.length > 0 ? 1 : 0) +
      (listing.locality ? 2 : 0) +
      (listing.owner.isVerified ? 4 : 0) +
      (listing.isBoosted ? 1 : 0) +
      (this.isRecentListing(listing.createdAt) ? 2 : 0)
    );
  }

  private scoreBudgetAlignment(
    listingAmount: number | null,
    preferredAmount: number | null,
    maxScore: number,
  ) {
    if (typeof listingAmount !== 'number' || typeof preferredAmount !== 'number' || preferredAmount <= 0) {
      return 0;
    }

    if (listingAmount <= preferredAmount) {
      return maxScore;
    }

    const overshootRatio = (listingAmount - preferredAmount) / preferredAmount;

    if (overshootRatio <= 0.1) {
      return this.roundScore(maxScore * 0.5);
    }

    if (overshootRatio <= 0.2) {
      return this.roundScore(maxScore * 0.25);
    }

    return 0;
  }

  private scoreMoveInAlignment(
    listingMoveInDate: Date | null,
    preferredMoveInDate: Date,
    maxScore: number,
  ) {
    if (!listingMoveInDate || !preferredMoveInDate) {
      return 0;
    }

    const diffInDays =
      Math.abs(listingMoveInDate.getTime() - preferredMoveInDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays <= 7) {
      return maxScore;
    }

    if (diffInDays <= 14) {
      return this.roundScore(maxScore * 0.8);
    }

    if (diffInDays <= 30) {
      return this.roundScore(maxScore * 0.5);
    }

    if (diffInDays <= 45) {
      return this.roundScore(maxScore * 0.2);
    }

    return 0;
  }

  private scorePreferenceOverlap(matches: number, totalPreferences: number, maxScore: number) {
    if (matches <= 0 || totalPreferences <= 0) {
      return 0;
    }

    return this.roundScore((matches / totalPreferences) * maxScore);
  }

  private isRecentListing(createdAt: Date) {
    const diffInDays = Math.abs(Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 14;
  }

  private normalizeMatchValue(value?: string | null) {
    return value?.trim().toLowerCase() ?? '';
  }

  private humanizeEnum(value?: string | null) {
    return (
      value
        ?.toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') ?? ''
    );
  }

  private roundScore(value: number) {
    return Math.round(value);
  }

  private normalizeListingImages(
    images: NonNullable<CreateListingDto['images']>,
    listingType: ListingType,
    listingStatus: ListingStatus,
  ) {
    if (
      listingType === ListingType.tenant_replacement &&
      listingStatus !== ListingStatus.DRAFT &&
      images.length < 2
    ) {
      throw new BadRequestException('At least 2 listing images are required for tenant replacement posts.');
    }

    if (images.length > 8) {
      throw new BadRequestException('A maximum of 8 listing images is allowed.');
    }

    return [...images]
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((image, index) => ({
        assetProvider: image.assetProvider,
        providerAssetId: image.providerAssetId,
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        sortOrder: index,
        isCover: index === 0,
      }));
  }

  async deleteListingForOwner(listingId: string, ownerUserId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, ownerUserId, type: ListingType.tenant_replacement },
      include: { images: true },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with id "${listingId}" was not found.`);
    }

    await this.destroyCloudinaryListingImages(listing.images);

    await this.prisma.listing.delete({
      where: { id: listingId },
    });

    return { deleted: true, id: listingId };
  }

  private async destroyCloudinaryListingImages(
    images: Array<{ assetProvider: string; providerAssetId: string }>,
  ) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || images.length === 0) {
      return;
    }

    await Promise.all(
      images
        .filter((image) => image.assetProvider === AssetProvider.CLOUDINARY)
        .map((image) => this.destroyCloudinaryAsset(image.providerAssetId, cloudName, apiKey, apiSecret)),
    );
  }

  private async destroyCloudinaryAsset(
    publicId: string,
    cloudName: string,
    apiKey: string,
    apiSecret: string,
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const body = new URLSearchParams({
      public_id: publicId,
      api_key: apiKey,
      timestamp: String(timestamp),
      invalidate: 'true',
      signature,
    });

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Failed to delete Cloudinary asset "${publicId}".`);
    }
  }

  private normalizeNearbyPlaces(nearbyPlaces: NonNullable<CreateListingDto['nearbyPlaces']>) {
    const normalizedPlaces = nearbyPlaces
      .map((place) => ({
        name: place.name.trim().replace(/\s+/g, ' '),
        type: place.type,
      }))
      .filter((place) => place.name.length > 0);

    const uniquePlaces = normalizedPlaces.filter(
      (place, index, places) =>
        places.findIndex((candidate) => candidate.name.toLowerCase() === place.name.toLowerCase()) === index,
    );

    if (uniquePlaces.length > 5) {
      throw new BadRequestException('A maximum of 5 nearby workplaces is allowed.');
    }

    return uniquePlaces;
  }

  private normalizeAmenities(amenities?: CreateListingDto['amenities']) {
    if (!amenities?.length) {
      return [];
    }

    return amenities
      .map((amenity) => amenity.trim().replace(/\s+/g, ' '))
      .filter((amenity, index, allAmenities) => {
        if (!amenity) {
          return false;
        }

        return allAmenities.findIndex((candidate) => candidate.toLowerCase() === amenity.toLowerCase()) === index;
      })
      .slice(0, 24);
  }

  private validateListingPayload(
    listingType: ListingType,
    listingStatus: ListingStatus,
    dto: Partial<CreateListingDto>,
  ) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Listing title is required.');
    }

    if (listingType !== ListingType.tenant_replacement) {
      throw new BadRequestException('Only tenant replacement listings are active in the current housing MVP.');
    }

    if (listingStatus === ListingStatus.DRAFT) {
      return;
    }

    if (!dto.contactPhone?.trim()) {
      throw new BadRequestException('A contact phone or WhatsApp number is required.');
    }

    if (!dto.city?.trim()) {
      throw new BadRequestException('City is required for tenant replacement listings.');
    }

    if (!dto.locality?.trim()) {
      throw new BadRequestException('Locality is required for tenant replacement listings.');
    }

    if (dto.rentAmount === undefined) {
      throw new BadRequestException('Rent amount is required for tenant replacement listings.');
    }

    if (!dto.propertyType) {
      throw new BadRequestException('Property type is required for tenant replacement listings.');
    }

    if (!dto.occupancyType) {
      throw new BadRequestException('Occupancy type is required for tenant replacement listings.');
    }

    if (!dto.moveInDate) {
      throw new BadRequestException('Move-in date is required for tenant replacement listings.');
    }

    if (!dto.images?.length) {
      throw new BadRequestException('At least 2 listing images are required for tenant replacement posts.');
    }
  }
}
