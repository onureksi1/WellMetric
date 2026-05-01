import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { DefaultLanguage } from './create-company.dto';

export class UpdateSettingsDto {
  @IsBoolean()
  @IsOptional()
  employee_accounts?: boolean;

  @IsEnum(DefaultLanguage)
  @IsOptional()
  default_language?: DefaultLanguage;

  @IsNumber()
  @Min(3)
  @Max(20)
  @IsOptional()
  anonymity_threshold?: number;

  @IsBoolean()
  @IsOptional()
  benchmark_visible?: boolean;
}
