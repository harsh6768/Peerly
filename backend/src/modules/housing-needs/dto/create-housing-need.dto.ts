import {
  ContactMode,
  HousingNeedStatus,
  OccupancyType,
  PropertyType,
  UrgencyLevel,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateHousingNeedNearbyPlaceDto } from './create-housing-need-nearby-place.dto';

export class CreateHousingNeedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  preferredPropertyType: PropertyType;

  @ApiProperty({ enum: OccupancyType })
  @IsEnum(OccupancyType)
  preferredOccupancy: OccupancyType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRentAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDepositAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMaintenanceAmount?: number;

  @ApiPropertyOptional({ type: [String], maxItems: 24 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  preferredAmenities?: string[];

  @ApiPropertyOptional({ type: [CreateHousingNeedNearbyPlaceDto], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateHousingNeedNearbyPlaceDto)
  nearbyPlaces?: CreateHousingNeedNearbyPlaceDto[];

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z' })
  @IsDateString()
  moveInDate: string;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ enum: ContactMode })
  @IsOptional()
  @IsEnum(ContactMode)
  preferredContactMode?: ContactMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: HousingNeedStatus })
  @IsOptional()
  @IsEnum(HousingNeedStatus)
  status?: HousingNeedStatus;
}
