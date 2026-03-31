import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
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

  async findAll(city?: string, status?: ListingStatus, nearby?: string) {
    const trimmedNearby = nearby?.trim();
    const listings = await this.prisma.listing.findMany({
      where: {
        ...buildWhere({ city, status }),
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
        createdAt: 'desc',
      },
    });

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

    if (!listing) {
      throw new NotFoundException(`Listing with id "${id}" was not found.`);
    }

    return listing;
  }

  create(dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        ownerUserId: dto.ownerUserId,
        organizationId: dto.organizationId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        locality: dto.locality,
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        propertyType: dto.propertyType,
        occupancyType: dto.occupancyType,
        moveInDate: toRequiredDate(dto.moveInDate),
        moveOutDate: toOptionalDate(dto.moveOutDate),
        urgencyLevel: dto.urgencyLevel,
        contactMode: dto.contactMode,
        status: dto.status,
        isBoosted: dto.isBoosted,
        brokerAllowed: dto.brokerAllowed,
        nearbyPlaces: dto.nearbyPlaces?.length
          ? {
              create: this.normalizeNearbyPlaces(dto.nearbyPlaces),
            }
          : undefined,
        images: {
          create: this.normalizeListingImages(dto.images),
        },
      },
      include: listingInclude,
    });
  }

  async update(id: string, dto: UpdateListingDto) {
    await this.findById(id);

    return this.prisma.listing.update({
      where: { id },
      data: {
        ownerUserId: dto.ownerUserId,
        organizationId: dto.organizationId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        locality: dto.locality,
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        propertyType: dto.propertyType,
        occupancyType: dto.occupancyType,
        ...(dto.moveInDate ? { moveInDate: toRequiredDate(dto.moveInDate) } : {}),
        ...(dto.moveOutDate !== undefined ? { moveOutDate: toOptionalDate(dto.moveOutDate) } : {}),
        urgencyLevel: dto.urgencyLevel,
        contactMode: dto.contactMode,
        status: dto.status,
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
                create: this.normalizeListingImages(dto.images),
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

  private normalizeListingImages(images: CreateListingDto['images']) {
    if (images.length < 2) {
      throw new BadRequestException('At least 2 listing images are required.');
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
}
