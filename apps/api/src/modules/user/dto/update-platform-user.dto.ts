import { IsString, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, IsDateString } from 'class-validator';
import { UserRole } from './platform-user-filter.dto';

export class UpdatePlatformUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  full_name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  language?: string;

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
