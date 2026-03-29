import { Module } from '@nestjs/common';

import { AppSessionGuard } from './app-session.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AppSessionGuard],
  exports: [AuthService, AppSessionGuard],
})
export class AuthModule {}
