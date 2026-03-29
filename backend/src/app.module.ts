import { Module } from '@nestjs/common';

import { HealthController } from './common/health.controller';
import { AppBootstrapService } from './common/app-bootstrap.service';
import { HousingNeedsModule } from './modules/housing-needs/housing-needs.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ShipmentRequestsModule } from './modules/shipment-requests/shipment-requests.module';
import { TravelerRoutesModule } from './modules/traveler-routes/traveler-routes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ListingsModule,
    HousingNeedsModule,
    TravelerRoutesModule,
    ShipmentRequestsModule,
  ],
  controllers: [HealthController],
  providers: [AppBootstrapService],
})
export class AppModule {}
