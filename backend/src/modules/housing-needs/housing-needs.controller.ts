import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { HousingNeedStatus } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AppSessionGuard } from '../auth/app-session.guard';
import { CurrentSession } from '../auth/current-session.decorator';
import type { AuthenticatedSession } from '../auth/auth.types';
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

  @ApiOperation({ summary: 'List housing needs posted by the current user' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: HousingNeedStatus })
  @UseGuards(AppSessionGuard)
  @Get('mine')
  findMine(
    @CurrentSession() session: AuthenticatedSession,
    @Query('status') status?: HousingNeedStatus,
  ) {
    return this.housingNeedsService.findMine(session, status);
  }

  @ApiOperation({ summary: 'Get a housing need by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.housingNeedsService.findById(id);
  }

  @ApiOperation({ summary: 'Create a housing need post' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateHousingNeedDto })
  @UseGuards(AppSessionGuard)
  @Post()
  create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: CreateHousingNeedDto,
  ) {
    return this.housingNeedsService.create(session, dto);
  }

  @ApiOperation({ summary: 'Update a housing need post' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateHousingNeedDto })
  @UseGuards(AppSessionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: UpdateHousingNeedDto,
  ) {
    return this.housingNeedsService.updateForSession(id, session, dto);
  }
}
