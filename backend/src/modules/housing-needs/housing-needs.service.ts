import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HousingNeedStatus } from '@prisma/client';

import { buildWhere, housingNeedInclude, toRequiredDate } from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateHousingNeedDto } from './dto/create-housing-need.dto';
import { UpdateHousingNeedDto } from './dto/update-housing-need.dto';

@Injectable()
export class HousingNeedsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(city?: string, status?: HousingNeedStatus) {
    return this.prisma.housingNeed.findMany({
      where: buildWhere({ city, status }),
      include: housingNeedInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findMine(session: AuthenticatedSession, status?: HousingNeedStatus) {
    return this.prisma.housingNeed.findMany({
      where: buildWhere({
        userId: session.user.id,
        status,
      }),
      include: housingNeedInclude,
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

  async findById(id: string) {
    const housingNeed = await this.prisma.housingNeed.findUnique({
      where: { id },
      include: housingNeedInclude,
    });

    if (!housingNeed) {
      throw new NotFoundException(`Housing need with id "${id}" was not found.`);
    }

    return housingNeed;
  }

  create(session: AuthenticatedSession, dto: CreateHousingNeedDto) {
    return this.prisma.housingNeed.create({
      data: {
        userId: session.user.id,
        organizationId: dto.organizationId,
        city: dto.city,
        locality: dto.locality,
        preferredPropertyType: dto.preferredPropertyType,
        preferredOccupancy: dto.preferredOccupancy,
        maxRentAmount: dto.maxRentAmount,
        maxDepositAmount: dto.maxDepositAmount,
        maxMaintenanceAmount: dto.maxMaintenanceAmount,
        preferredAmenities: this.normalizeAmenities(dto.preferredAmenities),
        moveInDate: toRequiredDate(dto.moveInDate),
        urgencyLevel: dto.urgencyLevel,
        preferredContactMode: dto.preferredContactMode,
        notes: dto.notes,
        status: dto.status,
        nearbyPlaces: dto.nearbyPlaces?.length
          ? {
              create: this.normalizeNearbyPlaces(dto.nearbyPlaces),
            }
          : undefined,
      },
      include: housingNeedInclude,
    });
  }

  async updateForSession(id: string, session: AuthenticatedSession, dto: UpdateHousingNeedDto) {
    const housingNeed = await this.findById(id);

    if (housingNeed.userId !== session.user.id) {
      throw new ForbiddenException('You cannot update this housing need.');
    }

    return this.prisma.housingNeed.update({
      where: { id },
      data: {
        organizationId: dto.organizationId,
        city: dto.city,
        locality: dto.locality,
        preferredPropertyType: dto.preferredPropertyType,
        preferredOccupancy: dto.preferredOccupancy,
        maxRentAmount: dto.maxRentAmount,
        maxDepositAmount: dto.maxDepositAmount,
        maxMaintenanceAmount: dto.maxMaintenanceAmount,
        preferredAmenities: dto.preferredAmenities ? this.normalizeAmenities(dto.preferredAmenities) : undefined,
        ...(dto.moveInDate ? { moveInDate: toRequiredDate(dto.moveInDate) } : {}),
        urgencyLevel: dto.urgencyLevel,
        preferredContactMode: dto.preferredContactMode,
        notes: dto.notes,
        status: dto.status,
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
      },
      include: housingNeedInclude,
    });
  }

  private normalizeAmenities(amenities?: string[]) {
    const normalizedAmenities = (amenities ?? [])
      .map((amenity) => amenity.trim())
      .filter(Boolean);

    return Array.from(new Set(normalizedAmenities));
  }

  private normalizeNearbyPlaces(nearbyPlaces: NonNullable<CreateHousingNeedDto['nearbyPlaces']>) {
    const normalizedPlaces = nearbyPlaces
      .map((place) => ({
        name: place.name.trim(),
        type: place.type,
      }))
      .filter((place) => place.name.length > 0);

    const dedupedPlaces = normalizedPlaces.filter(
      (place, index) =>
        normalizedPlaces.findIndex(
          (candidate) =>
            candidate.name.toLowerCase() === place.name.toLowerCase() && candidate.type === place.type,
        ) === index,
    );

    return dedupedPlaces;
  }
}
