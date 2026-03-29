import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitLinkedinVerificationDto {
  @ApiProperty()
  @IsUrl({
    require_protocol: true,
  })
  linkedinUrl: string;

  @ApiPropertyOptional({
    description: 'Optional verification code placed in the LinkedIn bio for manual review.',
  })
  @IsOptional()
  @IsString()
  proofCode?: string;
}

