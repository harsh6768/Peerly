import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewLinkedinVerificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({
    enum: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
  })
  @IsEnum(VerificationStatus)
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
