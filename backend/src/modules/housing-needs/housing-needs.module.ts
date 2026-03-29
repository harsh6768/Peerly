import { Module } from '@nestjs/common';

import { HousingNeedsController } from './housing-needs.controller';
import { HousingNeedsService } from './housing-needs.service';

@Module({
  controllers: [HousingNeedsController],
  providers: [HousingNeedsService],
})
export class HousingNeedsModule {}
