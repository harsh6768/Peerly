import { Injectable, NotFoundException } from '@nestjs/common';
import { ShipmentRequestStatus } from '@prisma/client';

import { buildWhere, listInclude, toRequiredDate } from '../../common/query-helpers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShipmentRequestDto } from './dto/create-shipment-request.dto';
import { UpdateShipmentRequestDto } from './dto/update-shipment-request.dto';

@Injectable()
export class ShipmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sourceCity?: string, destinationCity?: string, status?: ShipmentRequestStatus) {
    return this.prisma.shipmentRequest.findMany({
      where: buildWhere({ sourceCity, destinationCity, status }),
      include: listInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const shipmentRequest = await this.prisma.shipmentRequest.findUnique({
      where: { id },
      include: listInclude,
    });

    if (!shipmentRequest) {
      throw new NotFoundException(`Shipment request with id "${id}" was not found.`);
    }

    return shipmentRequest;
  }

  create(dto: CreateShipmentRequestDto) {
    return this.prisma.shipmentRequest.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        sourceCity: dto.sourceCity,
        sourceArea: dto.sourceArea,
        destinationCity: dto.destinationCity,
        destinationArea: dto.destinationArea,
        requiredBy: toRequiredDate(dto.requiredBy),
        itemType: dto.itemType,
        itemSize: dto.itemSize,
        itemWeightKg: dto.itemWeightKg,
        specialHandlingNotes: dto.specialHandlingNotes,
        urgencyLevel: dto.urgencyLevel,
        quotedBudget: dto.quotedBudget,
        prohibitedItemConfirmed: dto.prohibitedItemConfirmed,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateShipmentRequestDto) {
    await this.findById(id);

    return this.prisma.shipmentRequest.update({
      where: { id },
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        sourceCity: dto.sourceCity,
        sourceArea: dto.sourceArea,
        destinationCity: dto.destinationCity,
        destinationArea: dto.destinationArea,
        ...(dto.requiredBy ? { requiredBy: toRequiredDate(dto.requiredBy) } : {}),
        itemType: dto.itemType,
        itemSize: dto.itemSize,
        itemWeightKg: dto.itemWeightKg,
        specialHandlingNotes: dto.specialHandlingNotes,
        urgencyLevel: dto.urgencyLevel,
        quotedBudget: dto.quotedBudget,
        prohibitedItemConfirmed: dto.prohibitedItemConfirmed,
        status: dto.status,
      },
      include: listInclude,
    });
  }
}
