import { Injectable, NotFoundException } from '@nestjs/common';
import { HousingNeedStatus } from '@prisma/client';

import { buildWhere, listInclude, toRequiredDate } from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHousingNeedDto } from './dto/create-housing-need.dto';
import { UpdateHousingNeedDto } from './dto/update-housing-need.dto';

@Injectable()
export class HousingNeedsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(city?: string, status?: HousingNeedStatus) {
    return this.prisma.housingNeed.findMany({
      where: buildWhere({ city, status }),
      include: listInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const housingNeed = await this.prisma.housingNeed.findUnique({
      where: { id },
      include: listInclude,
    });

    if (!housingNeed) {
      throw new NotFoundException(`Housing need with id "${id}" was not found.`);
    }

    return housingNeed;
  }

  create(dto: CreateHousingNeedDto) {
    return this.prisma.housingNeed.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        city: dto.city,
        locality: dto.locality,
        preferredPropertyType: dto.preferredPropertyType,
        preferredOccupancy: dto.preferredOccupancy,
        maxRentAmount: dto.maxRentAmount,
        moveInDate: toRequiredDate(dto.moveInDate),
        urgencyLevel: dto.urgencyLevel,
        preferredContactMode: dto.preferredContactMode,
        notes: dto.notes,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateHousingNeedDto) {
    await this.findById(id);

    return this.prisma.housingNeed.update({
      where: { id },
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        city: dto.city,
        locality: dto.locality,
        preferredPropertyType: dto.preferredPropertyType,
        preferredOccupancy: dto.preferredOccupancy,
        maxRentAmount: dto.maxRentAmount,
        ...(dto.moveInDate ? { moveInDate: toRequiredDate(dto.moveInDate) } : {}),
        urgencyLevel: dto.urgencyLevel,
        preferredContactMode: dto.preferredContactMode,
        notes: dto.notes,
        status: dto.status,
      },
      include: listInclude,
    });
  }
}
