import { ListingInquiryStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateListingInquiryStatusDto {
  @ApiProperty({ enum: ListingInquiryStatus })
  @IsEnum(ListingInquiryStatus)
  status: ListingInquiryStatus;

  @ApiPropertyOptional({ example: '2026-04-08T13:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledVisitAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  scheduledVisitNote?: string;
}
