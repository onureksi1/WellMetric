import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CompanyUserFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  per_page?: number;
}

export class CreateCompanyUserDto {
  @IsEmail()
  email: string;

  @IsString()
  full_name: string;

  @IsEnum(['hr_admin', 'employee'])
  role: 'hr_admin' | 'employee';

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateCompanyUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsEnum(['hr_admin', 'employee'])
  role?: 'hr_admin' | 'employee';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  language?: string;
}
