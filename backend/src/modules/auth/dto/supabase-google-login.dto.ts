import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SupabaseGoogleLoginDto {
  @ApiProperty({
    description: 'Supabase access token returned after Google OAuth completes.',
  })
  @IsString()
  @MinLength(20)
  accessToken: string;

  @ApiPropertyOptional({
    description: 'Optional fallback name to use when Supabase metadata is sparse.',
  })
  @IsOptional()
  @IsString()
  fallbackName?: string;
}

