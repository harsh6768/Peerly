import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @ApiOperation({ summary: 'List tenant replacement listings' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ListingStatus })
  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('status') status?: ListingStatus,
  ) {
    return this.listingsService.findAll(city, status);
  }

  @ApiOperation({ summary: 'Get a replacement tenant listing by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  @ApiOperation({ summary: 'Create a replacement tenant listing' })
  @ApiBody({ type: CreateListingDto })
  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a replacement tenant listing' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateListingDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }
}
