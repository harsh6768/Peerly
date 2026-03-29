import { Injectable, NotFoundException } from '@nestjs/common';
import { TravelerRouteStatus } from '@prisma/client';

import { buildWhere, listInclude, toRequiredDate } from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTravelerRouteDto } from './dto/create-traveler-route.dto';
import { UpdateTravelerRouteDto } from './dto/update-traveler-route.dto';

@Injectable()
export class TravelerRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sourceCity?: string, destinationCity?: string, status?: TravelerRouteStatus) {
    return this.prisma.travelerRoute.findMany({
      where: buildWhere({ sourceCity, destinationCity, status }),
      include: listInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const travelerRoute = await this.prisma.travelerRoute.findUnique({
      where: { id },
      include: listInclude,
    });

    if (!travelerRoute) {
      throw new NotFoundException(`Traveler route with id "${id}" was not found.`);
    }

    return travelerRoute;
  }

  create(dto: CreateTravelerRouteDto) {
    return this.prisma.travelerRoute.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        sourceCity: dto.sourceCity,
        sourceArea: dto.sourceArea,
        destinationCity: dto.destinationCity,
        destinationArea: dto.destinationArea,
        travelDate: toRequiredDate(dto.travelDate),
        travelTimeWindow: dto.travelTimeWindow,
        capacityType: dto.capacityType,
        capacityNotes: dto.capacityNotes,
        allowedItemTypes: dto.allowedItemTypes,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateTravelerRouteDto) {
    await this.findById(id);

    return this.prisma.travelerRoute.update({
      where: { id },
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        sourceCity: dto.sourceCity,
        sourceArea: dto.sourceArea,
        destinationCity: dto.destinationCity,
        destinationArea: dto.destinationArea,
        ...(dto.travelDate ? { travelDate: toRequiredDate(dto.travelDate) } : {}),
        travelTimeWindow: dto.travelTimeWindow,
        capacityType: dto.capacityType,
        capacityNotes: dto.capacityNotes,
        allowedItemTypes: dto.allowedItemTypes,
        status: dto.status,
      },
      include: listInclude,
    });
  }
}
