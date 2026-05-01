import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty({ message: 'Token zorunludur.' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre zorunludur.' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  password: string;
}
