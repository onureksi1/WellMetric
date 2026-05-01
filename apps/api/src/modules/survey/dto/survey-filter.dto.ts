import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SurveyFilterDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  per_page?: number = 50;
}
