import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

/** Reads `STATIC_MAP_PREVIEW_ENABLED`. When unset, defaults to true. */
function staticMapPreviewEnabledFromEnv(): boolean {
  const raw = process.env.STATIC_MAP_PREVIEW_ENABLED?.trim().toLowerCase();
  if (!raw) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(raw)) {
    return false;
  }
  if (['1', 'true', 'yes', 'on'].includes(raw)) {
    return true;
  }
  return true;
}

class PublicConfigResponseDto {
  @ApiProperty({
    nullable: true,
    description:
      'Cloudinary cloud name for building https://res.cloudinary.com/... URLs on the client.',
  })
  cloudinaryCloudName!: string | null;

  @ApiProperty({
    description:
      'When false, web clients should not request Google Static Maps (billing kill switch). ' +
      'Frontend build can also set VITE_GOOGLE_MAPS_STATIC_MAP_ENABLED=false.',
  })
  staticMapPreviewEnabled!: boolean;
}

@ApiTags('public')
@Controller('public-config')
export class PublicConfigController {
  @ApiOperation({
    summary:
      'Non-secret client config (e.g. Cloudinary cloud name for image delivery URLs). No authentication.',
  })
  @ApiOkResponse({ type: PublicConfigResponseDto })
  @Get()
  getPublicConfig(): PublicConfigResponseDto {
    const cloudinaryCloudName =
      process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;
    return {
      cloudinaryCloudName,
      staticMapPreviewEnabled: staticMapPreviewEnabledFromEnv(),
    };
  }
}
