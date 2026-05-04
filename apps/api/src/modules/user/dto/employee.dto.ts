import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  email?: string;

  @IsOptional()
  language?: string;
}

export class EmployeeFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  @Type(() => String)
  @Transform(({ value }) => (value === '' ? undefined : value))
  department_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
