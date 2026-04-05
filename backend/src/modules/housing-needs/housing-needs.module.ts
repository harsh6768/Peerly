import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { HousingNeedsController } from './housing-needs.controller';
import { HousingNeedsService } from './housing-needs.service';

@Module({
  imports: [AuthModule],
  controllers: [HousingNeedsController],
  providers: [HousingNeedsService],
})
export class HousingNeedsModule {}
