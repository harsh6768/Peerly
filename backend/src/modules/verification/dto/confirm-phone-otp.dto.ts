import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class ConfirmPhoneOtpDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  phone: string;

  @ApiProperty({
    description: 'Six-digit OTP sent to the phone number.',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
