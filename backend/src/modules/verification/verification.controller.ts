import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppSessionGuard } from '../auth/app-session.guard';
import { CurrentSession } from '../auth/current-session.decorator';
import type { AuthenticatedSession } from '../auth/auth.types';
import { ConfirmPhoneOtpDto } from './dto/confirm-phone-otp.dto';
import { ConfirmWorkEmailOtpDto } from './dto/confirm-work-email-otp.dto';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { RequestWorkEmailOtpDto } from './dto/request-work-email-otp.dto';
import { ReviewLinkedinVerificationDto } from './dto/review-linkedin-verification.dto';
import { SubmitLinkedinVerificationDto } from './dto/submit-linkedin-verification.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: 'Get the current user verification status and incentives' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @Get('me')
  getMyStatus(@CurrentSession() session: AuthenticatedSession) {
    return this.verificationService.getMyVerificationStatus(session);
  }

  @ApiOperation({ summary: 'Request an OTP for work email verification' })
  @ApiBearerAuth()
  @ApiBody({ type: RequestWorkEmailOtpDto })
  @UseGuards(AppSessionGuard)
  @Post('work-email/request-otp')
  requestWorkEmailOtp(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: RequestWorkEmailOtpDto,
  ) {
    return this.verificationService.requestWorkEmailOtp(session, dto);
  }

  @ApiOperation({ summary: 'Request an OTP for phone verification' })
  @ApiBearerAuth()
  @ApiBody({ type: RequestPhoneOtpDto })
  @UseGuards(AppSessionGuard)
  @Post('phone/request-otp')
  requestPhoneOtp(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: RequestPhoneOtpDto,
  ) {
    return this.verificationService.requestPhoneOtp(session, dto);
  }

  @ApiOperation({ summary: 'Confirm the OTP for work email verification' })
  @ApiBearerAuth()
  @ApiBody({ type: ConfirmWorkEmailOtpDto })
  @UseGuards(AppSessionGuard)
  @Post('work-email/confirm')
  confirmWorkEmailOtp(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: ConfirmWorkEmailOtpDto,
  ) {
    return this.verificationService.confirmWorkEmailOtp(session, dto);
  }

  @ApiOperation({ summary: 'Confirm the OTP for phone verification' })
  @ApiBearerAuth()
  @ApiBody({ type: ConfirmPhoneOtpDto })
  @UseGuards(AppSessionGuard)
  @Post('phone/confirm')
  confirmPhoneOtp(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: ConfirmPhoneOtpDto,
  ) {
    return this.verificationService.confirmPhoneOtp(session, dto);
  }

  @ApiOperation({ summary: 'Submit LinkedIn verification for manual review' })
  @ApiBearerAuth()
  @ApiBody({ type: SubmitLinkedinVerificationDto })
  @UseGuards(AppSessionGuard)
  @Post('linkedin/submit')
  submitLinkedinVerification(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: SubmitLinkedinVerificationDto,
  ) {
    return this.verificationService.submitLinkedinVerification(session, dto);
  }

  @ApiOperation({ summary: 'Cancel the current LinkedIn verification flow' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @Post('linkedin/cancel')
  cancelLinkedinVerification(@CurrentSession() session: AuthenticatedSession) {
    return this.verificationService.cancelLinkedinVerification(session);
  }

  @ApiOperation({ summary: 'Approve or reject a LinkedIn verification request' })
  @ApiBearerAuth()
  @ApiBody({ type: ReviewLinkedinVerificationDto })
  @UseGuards(AppSessionGuard)
  @Post('linkedin/review')
  reviewLinkedinVerification(
    @CurrentSession() session: AuthenticatedSession,
    @Body() dto: ReviewLinkedinVerificationDto,
  ) {
    return this.verificationService.reviewLinkedinVerification(session, dto);
  }

  @ApiOperation({ summary: 'Get verification funnel metrics for the MVP' })
  @Get('metrics')
  getMetrics() {
    return this.verificationService.getVerificationMetrics();
  }
}
