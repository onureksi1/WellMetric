import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz.' })
  @IsNotEmpty({ message: 'Email adresi zorunludur.' })
  email: string;
}
