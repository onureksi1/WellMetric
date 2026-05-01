import { IsEmail, IsString, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, IsDateString } from 'class-validator';
import { UserRole } from './platform-user-filter.dto';

export class CreatePlatformUserDto {
  @IsEmail({}, { message: 'Geçersiz e-posta formatı' })
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  full_name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  company_id: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  language?: string = 'tr';

  @IsOptional()
  @IsString()
  seniority?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;
}
