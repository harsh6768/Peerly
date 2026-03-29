import { Module } from '@nestjs/common';

import { ShipmentRequestsController } from './shipment-requests.controller';
import { ShipmentRequestsService } from './shipment-requests.service';

@Module({
  controllers: [ShipmentRequestsController],
  providers: [ShipmentRequestsService],
})
export class ShipmentRequestsModule {}
