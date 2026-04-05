import { ReportStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const entityActions = ['NONE', 'ARCHIVE_LISTING', 'DEACTIVATE_USER', 'REACTIVATE_USER'] as const;

export class ReviewReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ enum: entityActions })
  @IsOptional()
  @IsIn(entityActions)
  entityAction?: (typeof entityActions)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
