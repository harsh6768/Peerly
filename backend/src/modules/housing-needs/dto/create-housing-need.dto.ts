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
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHousingNeedDto {
  @ApiProperty()
  @IsString()
  userId: string;

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
