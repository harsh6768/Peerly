import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class ConfirmWorkEmailOtpDto {
  @ApiProperty()
  @IsEmail()
  workEmail: string;

  @ApiProperty({
    description: 'Six-digit OTP sent to the work email address.',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}

