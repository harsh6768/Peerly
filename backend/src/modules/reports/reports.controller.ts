import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AppSessionGuard } from '../auth/app-session.guard';
import { CurrentSession } from '../auth/current-session.decorator';
import type { AuthenticatedSession } from '../auth/auth.types';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AppSessionGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Create a report for a listing or user' })
  @ApiBody({ type: CreateReportDto })
  @Post()
  create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(session, dto);
  }

  @ApiOperation({ summary: 'Get the admin moderation queue for reports and pending LinkedIn reviews' })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @Get('moderation-queue')
  getModerationQueue(
    @CurrentSession() session: AuthenticatedSession,
    @Query('status') status?: ReportStatus,
  ) {
    return this.reportsService.getModerationQueue(session, status);
  }

  @ApiOperation({ summary: 'Review a report and optionally action the reported entity' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: ReviewReportDto })
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: ReviewReportDto,
  ) {
    return this.reportsService.reviewReport(id, session, dto);
  }
}
