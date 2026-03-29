import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TravelerRouteStatus } from '@prisma/client';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateTravelerRouteDto } from './dto/create-traveler-route.dto';
import { TravelerRoutesService } from './traveler-routes.service';
import { UpdateTravelerRouteDto } from './dto/update-traveler-route.dto';

@ApiTags('traveler-routes')
@Controller('traveler-routes')
export class TravelerRoutesController {
  constructor(private readonly travelerRoutesService: TravelerRoutesService) {}

  @ApiOperation({ summary: 'List traveler routes between cities' })
  @ApiQuery({ name: 'sourceCity', required: false })
  @ApiQuery({ name: 'destinationCity', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TravelerRouteStatus })
  @Get()
  findAll(
    @Query('sourceCity') sourceCity?: string,
    @Query('destinationCity') destinationCity?: string,
    @Query('status') status?: TravelerRouteStatus,
  ) {
    return this.travelerRoutesService.findAll(sourceCity, destinationCity, status);
  }

  @ApiOperation({ summary: 'Get a traveler route by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.travelerRoutesService.findById(id);
  }

  @ApiOperation({ summary: 'Create a traveler route post' })
  @ApiBody({ type: CreateTravelerRouteDto })
  @Post()
  create(@Body() dto: CreateTravelerRouteDto) {
    return this.travelerRoutesService.create(dto);
  }

  @ApiOperation({ summary: 'Update a traveler route post' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTravelerRouteDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTravelerRouteDto) {
    return this.travelerRoutesService.update(id, dto);
  }
}
