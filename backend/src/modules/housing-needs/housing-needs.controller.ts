import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { HousingNeedStatus } from '@prisma/client';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateHousingNeedDto } from './dto/create-housing-need.dto';
import { HousingNeedsService } from './housing-needs.service';
import { UpdateHousingNeedDto } from './dto/update-housing-need.dto';

@ApiTags('housing-needs')
@Controller('housing-needs')
export class HousingNeedsController {
  constructor(private readonly housingNeedsService: HousingNeedsService) {}

  @ApiOperation({ summary: 'List housing needs posted by users' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'status', required: false, enum: HousingNeedStatus })
  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('status') status?: HousingNeedStatus,
  ) {
    return this.housingNeedsService.findAll(city, status);
  }

  @ApiOperation({ summary: 'Get a housing need by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.housingNeedsService.findById(id);
  }

  @ApiOperation({ summary: 'Create a housing need post' })
  @ApiBody({ type: CreateHousingNeedDto })
  @Post()
  create(@Body() dto: CreateHousingNeedDto) {
    return this.housingNeedsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a housing need post' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateHousingNeedDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHousingNeedDto) {
    return this.housingNeedsService.update(id, dto);
  }
}
