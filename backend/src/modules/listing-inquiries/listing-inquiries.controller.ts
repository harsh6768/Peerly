import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ListingInquiryStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentSession } from '../auth/current-session.decorator';
import type { AuthenticatedSession } from '../auth/auth.types';
import { AppSessionGuard } from '../auth/app-session.guard';
import { CreateListingInquiryDto } from './dto/create-listing-inquiry.dto';
import { UpdateListingInquiryStatusDto } from './dto/update-listing-inquiry-status.dto';
import { ListingInquiriesService } from './listing-inquiries.service';

@ApiTags('listing-inquiries')
@ApiBearerAuth()
@UseGuards(AppSessionGuard)
@Controller('listing-inquiries')
export class ListingInquiriesController {
  constructor(private readonly listingInquiriesService: ListingInquiriesService) {}

  @ApiOperation({ summary: 'List listing inquiries for the current user' })
  @ApiQuery({ name: 'scope', required: false, enum: ['owner', 'requester'] })
  @ApiQuery({ name: 'status', required: false, enum: ListingInquiryStatus })
  @ApiQuery({ name: 'listingId', required: false })
  @Get()
  findAll(
    @CurrentSession() session: AuthenticatedSession,
    @Query('scope') scope?: 'owner' | 'requester',
    @Query('status') status?: ListingInquiryStatus,
    @Query('listingId') listingId?: string,
  ) {
    return this.listingInquiriesService.findAllForSession(
      session,
      scope === 'owner' ? 'owner' : 'requester',
      status,
      listingId,
    );
  }

  @ApiOperation({ summary: 'Get a listing inquiry for the current user' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    return this.listingInquiriesService.findByIdForSession(id, session);
  }

  @ApiOperation({ summary: 'Create a listing inquiry for a published listing' })
  @ApiBody({ type: CreateListingInquiryDto })
  @Post()
  create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: CreateListingInquiryDto,
  ) {
    return this.listingInquiriesService.create(session, dto);
  }

  @ApiOperation({ summary: 'Update the status or scheduled visit for a listing inquiry' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateListingInquiryStatusDto })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: UpdateListingInquiryStatusDto,
  ) {
    return this.listingInquiriesService.updateStatus(id, session, dto);
  }
}
