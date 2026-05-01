import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz.' })
  @IsNotEmpty({ message: 'Email adresi zorunludur.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre zorunludur.' })
  password: string;
}
