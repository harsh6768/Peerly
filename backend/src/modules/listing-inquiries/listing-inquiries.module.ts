import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ListingInquiriesController } from './listing-inquiries.controller';
import { ListingInquiriesService } from './listing-inquiries.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ListingInquiriesController],
  providers: [ListingInquiriesService],
})
export class ListingInquiriesModule {}
