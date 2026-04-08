import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType, OccupancyType, PropertyType } from '@prisma/client';

/** Cursor is the `id` of the last item from the previous page (stable sort: createdAt desc, id desc). */
export class ListListingsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nearby?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: OccupancyType })
  @IsOptional()
  @IsEnum(OccupancyType)
  occupancyType?: OccupancyType;

  @ApiPropertyOptional({ description: 'Minimum monthly rent (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentMin?: number;

  @ApiPropertyOptional({ description: 'Maximum monthly rent (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentMax?: number;

  @ApiPropertyOptional({
    description: 'Exclude listings owned by this user (e.g. find-room feed when signed in)',
  })
  @IsOptional()
  @IsString()
  excludeOwnerUserId?: string;

  @ApiPropertyOptional({ description: 'Page size (default 30, max 50). Omit for legacy full list.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor = id of last item from previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
