import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppSessionGuard } from './app-session.guard';
import { AuthService } from './auth.service';
import { CurrentSession } from './current-session.decorator';
import { SupabaseGoogleLoginDto } from './dto/supabase-google-login.dto';
import type { AuthenticatedSession } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Create or fetch an app session from a Supabase Google session' })
  @ApiBody({ type: SupabaseGoogleLoginDto })
  @Post('supabase/google-login')
  login(@Body() dto: SupabaseGoogleLoginDto) {
    return this.authService.loginWithSupabaseGoogle(dto);
  }

  @ApiOperation({ summary: 'Get the current authenticated app session' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @Get('me')
  me(@CurrentSession() session: AuthenticatedSession) {
    return session;
  }

  @ApiOperation({ summary: 'Destroy the current authenticated app session' })
  @ApiBearerAuth()
  @UseGuards(AppSessionGuard)
  @Post('logout')
  logout(@CurrentSession() session: AuthenticatedSession) {
    return this.authService.logout(session.token);
  }
}

