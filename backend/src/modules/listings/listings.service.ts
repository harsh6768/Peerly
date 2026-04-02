import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ListingStatus, ListingType } from '@prisma/client';
import { createHash } from 'node:crypto';

import {
  buildWhere,
  listingInclude,
  toOptionalDate,
  toRequiredDate,
} from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    city?: string,
    status?: ListingStatus,
    nearby?: string,
    ownerUserId?: string,
    includeArchived = false,
  ) {
    const trimmedNearby = nearby?.trim();
    const listings = await this.prisma.listing.findMany({
      where: {
        ...buildWhere({
          city,
          ...(ownerUserId ? {} : { status: status ?? ListingStatus.PUBLISHED }),
          type: ListingType.tenant_replacement,
          ownerUserId,
        }),
        ...(ownerUserId
          ? status
            ? { status }
            : includeArchived
              ? {}
              : {
                  status: {
                    not: ListingStatus.ARCHIVED,
                  },
                }
          : {}),
        ...(trimmedNearby
          ? {
              nearbyPlaces: {
                some: {
                  name: trimmedNearby,
                },
              },
            }
          : {}),
      },
      include: listingInclude,
      orderBy: {
        ...(ownerUserId ? { updatedAt: 'desc' } : { createdAt: 'desc' }),
      },
    });

    if (ownerUserId) {
      return listings;
    }

    return listings.sort((left, right) => {
      if (left.isBoosted !== right.isBoosted) {
        return Number(right.isBoosted) - Number(left.isBoosted);
      }

      if (left.owner.isVerified !== right.owner.isVerified) {
        return Number(right.owner.isVerified) - Number(left.owner.isVerified);
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });
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
          imageUrl: image.imageUrl,
          thumbnailUrl: image.thumbnailUrl,
          detailUrl: image.detailUrl,
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

    return this.prisma.listing.update({
      where: { id },
      data: {
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
      },
      include: listingInclude,
    });
  }

  createSignedUploadSignature(userId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured on the backend.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `trusted-network/listings/${userId}`;
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return {
      cloudName,
      apiKey,
      timestamp,
      folder,
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

    const folderPrefix = `trusted-network/listings/${userId}/`;
    const invalidAssetIds = assetIds.filter((assetId) => !assetId.startsWith(folderPrefix));

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
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
        detailUrl: image.detailUrl,
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        sortOrder: index,
        isCover: index === 0,
      }));
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
