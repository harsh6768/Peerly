import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateUploadSignatureDto {
  @ApiPropertyOptional({
    description:
      'Tenant-replacement uploads must pass listing id (folder …/userId/listingId). Omit for legacy flows (e.g. send_request) using …/userId only.',
  })
  @IsOptional()
  @IsString()
  listingId?: string;
}
