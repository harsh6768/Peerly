import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ShipmentRequestStatus } from '@prisma/client';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateShipmentRequestDto } from './dto/create-shipment-request.dto';
import { ShipmentRequestsService } from './shipment-requests.service';
import { UpdateShipmentRequestDto } from './dto/update-shipment-request.dto';

@ApiTags('shipment-requests')
@Controller('shipment-requests')
export class ShipmentRequestsController {
  constructor(private readonly shipmentRequestsService: ShipmentRequestsService) {}

  @ApiOperation({ summary: 'List shipment requests posted by users' })
  @ApiQuery({ name: 'sourceCity', required: false })
  @ApiQuery({ name: 'destinationCity', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentRequestStatus })
  @Get()
  findAll(
    @Query('sourceCity') sourceCity?: string,
    @Query('destinationCity') destinationCity?: string,
    @Query('status') status?: ShipmentRequestStatus,
  ) {
    return this.shipmentRequestsService.findAll(sourceCity, destinationCity, status);
  }

  @ApiOperation({ summary: 'Get a shipment request by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.shipmentRequestsService.findById(id);
  }

  @ApiOperation({ summary: 'Create a shipment request' })
  @ApiBody({ type: CreateShipmentRequestDto })
  @Post()
  create(@Body() dto: CreateShipmentRequestDto) {
    return this.shipmentRequestsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a shipment request' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateShipmentRequestDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentRequestDto) {
    return this.shipmentRequestsService.update(id, dto);
  }
}
