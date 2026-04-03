import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const visitActions = ['CONFIRM', 'CANCEL', 'COMPLETE'] as const;

export type ListingInquiryVisitAction = (typeof visitActions)[number];

export class UpdateListingInquiryVisitDto {
  @ApiPropertyOptional({ enum: visitActions })
  @IsIn(visitActions)
  action: ListingInquiryVisitAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ example: '2026-04-10T11:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledVisitAt?: string;
}
