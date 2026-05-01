import { IsString, IsOptional, IsInt, IsBoolean, IsHexColor } from 'class-validator';

export class CreateCreditTypeDto {
  @IsString()
  key: string;

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
  @IsString()
  icon?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
