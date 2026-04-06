import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AppSessionGuard } from '../auth/app-session.guard';
import { CurrentSession } from '../auth/current-session.decorator';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateListingDto } from './dto/create-listing.dto';
import { DeleteListingImageUploadsDto } from './dto/delete-listing-image-uploads.dto';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'List published tenant replacement listings' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ListingStatus })
  @ApiQuery({ name: 'nearby', required: false })
  @ApiQuery({ name: 'ownerUserId', required: false })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('status') status?: ListingStatus,
    @Query('nearby') nearby?: string,
    @Query('ownerUserId') ownerUserId?: string,
    @Query('includeArchived') includeArchived?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const session = await this.resolveOptionalSession(authorization);

    return this.listingsService.findAll(
      city,
      status,
      nearby,
      ownerUserId,
      includeArchived === 'true',
      session,
    );
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

  @ApiOperation({ summary: 'Create a signed Cloudinary upload signature for listing images' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @Post('upload-signature')
  createUploadSignature(@CurrentSession() session: AuthenticatedSession) {
    return this.listingsService.createSignedUploadSignature(session.user.id);
  }

  @ApiOperation({ summary: 'Delete uploaded listing images that are no longer needed' })
  @ApiBearerAuth()
  @ApiBody({ type: DeleteListingImageUploadsDto })
  @UseGuards(AppSessionGuard)
  @Post('cleanup-uploads')
  cleanupUploadedImages(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: DeleteListingImageUploadsDto,
  ) {
    return this.listingsService.cleanupUploadedImages(session.user.id, dto.assetIds);
  }

  @ApiOperation({ summary: 'Update a replacement tenant listing' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateListingDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }

  private async resolveOptionalSession(authorization?: string) {
    const token = this.extractBearerToken(authorization);

    if (!token) {
      return undefined;
    }

    try {
      return await this.authService.getAuthenticatedSession(token);
    } catch {
      return undefined;
    }
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
