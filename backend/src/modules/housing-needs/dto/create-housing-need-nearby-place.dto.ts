import { NearbyPlaceType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateHousingNeedNearbyPlaceDto {
  @ApiProperty({ example: 'Ecospace' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: NearbyPlaceType, example: NearbyPlaceType.tech_park })
  @IsEnum(NearbyPlaceType)
  type: NearbyPlaceType;
}
