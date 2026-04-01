import { ContactMode, ItemType, ListingStatus, ListingType, OccupancyType, PropertyType, UrgencyLevel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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

  @ApiPropertyOptional({ enum: ListingType, example: ListingType.tenant_replacement })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toCity?: string;

  @ApiPropertyOptional({ enum: ItemType })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @ApiPropertyOptional({ example: '2026-04-16T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maintenanceAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  miscCharges?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 24 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: OccupancyType })
  @IsOptional()
  @IsEnum(OccupancyType)
  occupancyType?: OccupancyType;

  @ApiPropertyOptional({ example: '2026-04-05T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

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

  @ApiPropertyOptional({ type: [CreateListingImageDto], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateListingImageDto)
  images?: CreateListingImageDto[];
}
