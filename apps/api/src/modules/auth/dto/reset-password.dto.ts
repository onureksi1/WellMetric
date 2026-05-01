import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token zorunludur.' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre zorunludur.' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  newPassword: string;
}
