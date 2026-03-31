import { ContactMode, ListingStatus, OccupancyType, PropertyType, UrgencyLevel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateListingImageDto } from './create-listing-image.dto';
import { CreateListingNearbyPlaceDto } from './create-listing-nearby-place.dto';

export class CreateListingDto {
  // Required fields are just normal properties now.
  @ApiProperty()
  @IsString()
  ownerUserId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  locality: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ example: 12.9715987 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5945627 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ type: [CreateListingNearbyPlaceDto], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateListingNearbyPlaceDto)
  nearbyPlaces?: CreateListingNearbyPlaceDto[];

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  depositAmount?: number;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({ enum: OccupancyType })
  @IsEnum(OccupancyType)
  occupancyType: OccupancyType;

  @ApiProperty({ example: '2026-04-05T00:00:00.000Z' })
  @IsDateString()
  moveInDate: string;

  @ApiPropertyOptional({ example: '2026-04-02T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ enum: ContactMode })
  @IsOptional()
  @IsEnum(ContactMode)
  contactMode?: ContactMode;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBoosted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  brokerAllowed?: boolean;

  @ApiProperty({ type: [CreateListingImageDto], minItems: 2, maxItems: 8 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateListingImageDto)
  images: CreateListingImageDto[];
}
