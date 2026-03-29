import { ItemSize, ItemType, ShipmentRequestStatus, UrgencyLevel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateShipmentRequestDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty()
  @IsString()
  sourceCity: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceArea?: string;

  @ApiProperty()
  @IsString()
  destinationCity: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationArea?: string;

  @ApiProperty({ example: '2026-04-16T00:00:00.000Z' })
  @IsDateString()
  requiredBy: string;

  @ApiProperty({ enum: ItemType })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({ enum: ItemSize })
  @IsEnum(ItemSize)
  itemSize: ItemSize;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  itemWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialHandlingNotes?: string;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quotedBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  prohibitedItemConfirmed?: boolean;

  @ApiPropertyOptional({ enum: ShipmentRequestStatus })
  @IsOptional()
  @IsEnum(ShipmentRequestStatus)
  status?: ShipmentRequestStatus;
}
