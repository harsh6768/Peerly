import { Module } from '@nestjs/common';

import { TravelerRoutesController } from './traveler-routes.controller';
import { TravelerRoutesService } from './traveler-routes.service';

@Module({
  controllers: [TravelerRoutesController],
  providers: [TravelerRoutesService],
})
export class TravelerRoutesModule {}
