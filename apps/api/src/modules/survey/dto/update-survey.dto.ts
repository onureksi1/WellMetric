import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { SurveyType, SurveyFrequency } from './create-survey.dto';

export class UpdateSurveyDto {
  @IsString()
  @IsOptional()
  title_tr?: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  description_tr?: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @IsEnum(SurveyFrequency)
  @IsOptional()
  frequency?: SurveyFrequency;

  @IsNumber()
  @Min(0)
  @IsOptional()
  throttle_days?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
