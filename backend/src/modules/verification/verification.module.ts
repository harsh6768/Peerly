import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ResendEmailService } from './resend-email.service';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [AuthModule],
  controllers: [VerificationController],
  providers: [VerificationService, ResendEmailService],
})
export class VerificationModule {}
