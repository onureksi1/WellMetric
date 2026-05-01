import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CompanyPlan } from './create-company.dto';

export class CompanyFilterDto {
  @IsEnum(CompanyPlan)
  @IsOptional()
  plan?: CompanyPlan;

  @Transform(({ value }) => {
    if (value === 'active' || value === 'true' || value === true) return true;
    if (value === 'passive' || value === 'false' || value === false) return false;
    return undefined;
  })
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  industry?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  search?: string;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  consultant_id?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  per_page?: number = 50;
}
