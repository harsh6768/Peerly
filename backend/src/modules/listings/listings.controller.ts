import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { AppSessionGuard } from '../auth/app-session.guard';
import { CurrentSession } from '../auth/current-session.decorator';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { DeleteListingImageUploadsDto } from './dto/delete-listing-image-uploads.dto';
import { ListListingsQueryDto } from './dto/list-listings-query.dto';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary:
      'List listings (paginated). Returns { items, nextCursor }. Public browse defaults to limit=30; pass filters (property, occupancy, rent) for server-side filtering.',
  })
  @Get()
  async findAll(
    @Query() query: ListListingsQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const session = await this.resolveOptionalSession(authorization);

    return this.listingsService.findAll(query, session);
  }

  @ApiOperation({ summary: 'Create a replacement tenant listing' })
  @ApiBody({ type: CreateListingDto })
  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  @ApiOperation({
    summary:
      'Signed Cloudinary upload. Returns publicId under cirvo/listings/{userId}/{listingId?}/…; client must POST public_id + signature to Cloudinary (not folder). Optional listingId for tenant-replacement; omit for legacy user-only path (e.g. send_request).',
  })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @ApiBody({ type: CreateUploadSignatureDto })
  @Post('upload-signature')
  createUploadSignature(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: CreateUploadSignatureDto,
  ) {
    return this.listingsService.createSignedUploadSignature(session.user.id, dto.listingId?.trim());
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

  @ApiOperation({ summary: 'Get a replacement tenant listing by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  @ApiOperation({ summary: 'Update a replacement tenant listing' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateListingDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Permanently delete a listing and its Cloudinary images (owner only)' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @ApiParam({ name: 'id' })
  @Delete(':id')
  removeListing(@Param('id') id: string, @CurrentSession() session: AuthenticatedSession) {
    return this.listingsService.deleteListingForOwner(id, session.user.id);
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
