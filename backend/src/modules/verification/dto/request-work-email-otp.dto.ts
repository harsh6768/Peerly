import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestWorkEmailOtpDto {
  @ApiProperty()
  @IsEmail()
  workEmail: string;
}

