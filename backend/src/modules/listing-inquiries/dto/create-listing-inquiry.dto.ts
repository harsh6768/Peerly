import { OccupancyType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateListingInquiryDto {
  @ApiProperty()
  @IsString()
  listingId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ example: 22000 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  budgetAmount?: number;

  @ApiPropertyOptional({ example: '2026-04-10T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  preferredMoveInDate?: string;

  @ApiPropertyOptional({ enum: OccupancyType })
  @IsOptional()
  @IsEnum(OccupancyType)
  preferredOccupancy?: OccupancyType;

  @ApiPropertyOptional({ example: '2026-04-07T12:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  preferredVisitAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  preferredVisitNote?: string;
}
