import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '../auth/current-session.decorator';
import type { AuthenticatedSession } from '../auth/auth.types';
import { AppSessionGuard } from '../auth/app-session.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AppSessionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'List notifications for the current user (newest first)' })
  @Get()
  list(
    @CurrentSession() session: AuthenticatedSession,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listForSession(
      session,
      query.cursor,
      query.limit ?? 20,
    );
  }

  @ApiOperation({ summary: 'Unread notification count' })
  @Get('unread-count')
  unreadCount(@CurrentSession() session: AuthenticatedSession) {
    return this.notificationsService.unreadCountForSession(session);
  }

  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id' })
  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    return this.notificationsService.markRead(session, id);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('read-all')
  markAllRead(@CurrentSession() session: AuthenticatedSession) {
    return this.notificationsService.markAllRead(session);
  }
}
