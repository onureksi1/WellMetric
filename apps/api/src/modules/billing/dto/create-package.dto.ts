import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsObject, IsEnum } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  key: string;

  @IsEnum(['subscription', 'credit'])
  type: string;

  @IsString()
  label_tr: string;

  @IsString()
  label_en: string;

  @IsOptional()
  @IsString()
  description_tr?: string;

  @IsOptional()
  @IsString()
  description_en?: string;

  @IsOptional()
  @IsNumber()
  price_monthly?: number;

  @IsOptional()
  @IsNumber()
  price_yearly?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  credits?: Record<string, number>;

  @IsOptional()
  @IsInt()
  max_companies?: number;

  @IsOptional()
  @IsInt()
  max_employees?: number;

  @IsOptional()
  @IsBoolean()
  ai_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  white_label?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
