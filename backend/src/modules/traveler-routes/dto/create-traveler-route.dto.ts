import { CapacityType, ItemType, TravelerRouteStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTravelerRouteDto {
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

  @ApiProperty({ example: '2026-04-08T00:00:00.000Z' })
  @IsDateString()
  travelDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  travelTimeWindow?: string;

  @ApiProperty({ enum: CapacityType })
  @IsEnum(CapacityType)
  capacityType: CapacityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  capacityNotes?: string;

  @ApiProperty({ enum: ItemType, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ItemType, { each: true })
  allowedItemTypes: ItemType[];

  @ApiPropertyOptional({ enum: TravelerRouteStatus })
  @IsOptional()
  @IsEnum(TravelerRouteStatus)
  status?: TravelerRouteStatus;
}
