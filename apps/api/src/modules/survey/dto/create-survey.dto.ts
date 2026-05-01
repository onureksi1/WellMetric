import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max, IsUUID, IsDateString, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export enum SurveyType {
  GLOBAL = 'global',
  COMPANY_SPECIFIC = 'company_specific',
  ONBOARDING = 'onboarding',
  PULSE = 'pulse',
}

export enum SurveyFrequency {
  ONCE = 'once',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUALLY = 'biannually',
  ANNUALLY = 'annually',
}

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(300)
  title_tr: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  description_tr?: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @IsEnum(SurveyType)
  @IsNotEmpty()
  type: SurveyType;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsEnum(SurveyFrequency)
  @IsOptional()
  frequency?: SurveyFrequency;

  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean = true;

  @IsNumber()
  @Min(0)
  @IsOptional()
  throttle_days?: number = 7;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  @Type(() => Number)
  link_duration?: number = 7;

  @IsDateString()
  @IsOptional()
  starts_at?: string;

  @IsDateString()
  @IsOptional()
  ends_at?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
