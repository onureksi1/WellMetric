import { IsEmail, IsNotEmpty } from 'class-validator';

export class TestMailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;
}
