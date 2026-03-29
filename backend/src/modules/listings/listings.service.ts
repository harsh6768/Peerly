import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

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

  async findAll(city?: string, status?: ListingStatus) {
    const listings = await this.prisma.listing.findMany({
      where: buildWhere({ city, status }),
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
      },
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
      },
      include: listingInclude,
    });
  }
}
