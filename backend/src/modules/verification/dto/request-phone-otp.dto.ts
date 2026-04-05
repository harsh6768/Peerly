import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RequestPhoneOtpDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  phone: string;
}
