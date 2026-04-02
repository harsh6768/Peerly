import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Phone or WhatsApp number shown to other users when needed.',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
