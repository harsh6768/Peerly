import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class DeleteListingImageUploadsDto {
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 8,
    example: ['cirvo/listings/user_123/sample-image'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  assetIds: string[];
}
