import { IsOptional, IsString, IsEnum, IsBoolean, IsUUID, MinLength, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum UserRole {
  HR_ADMIN = 'hr_admin',
  EMPLOYEE = 'employee',
}

export class PlatformUserFilterDto {
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? undefined : value))
  company_id?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value }) => (value === '' ? undefined : value))
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (value === '' ? undefined : value))
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  per_page?: number = 50;
}
