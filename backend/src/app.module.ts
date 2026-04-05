import { Module } from '@nestjs/common';

import { HealthController } from './common/health.controller';
import { AppBootstrapService } from './common/app-bootstrap.service';
import { AuthModule } from './modules/auth/auth.module';
import { HousingNeedsModule } from './modules/housing-needs/housing-needs.module';
import { ListingInquiriesModule } from './modules/listing-inquiries/listing-inquiries.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { VerificationModule } from './modules/verification/verification.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VerificationModule,
    HousingNeedsModule,
    ListingsModule,
    ListingInquiriesModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [AppBootstrapService],
})
export class AppModule {}
