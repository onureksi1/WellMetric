import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, Min, Max, IsBoolean, IsInt, IsIn, MinLength, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateConsultantSurveyQuestionDto {
  @IsIn(['physical','mental','social','financial','work','overall'])
  @IsOptional()
  dimension?: string;

  @IsString() @MinLength(1)
  question_text_tr: string;

  @IsString() @IsOptional()
  question_text_en?: string;

  @IsIn(['likert5','likert10','star_rating','yes_no','nps',
         'number_input','matrix','single_choice','multi_choice',
         'ranking','open_text'])
  @IsOptional()
  question_type?: string;

  @IsBoolean() @IsOptional()
  is_reversed?: boolean;

  @IsBoolean() @IsOptional()
  is_required?: boolean;

  @IsNumber() @IsOptional()
  weight?: number;

  @IsInt() @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  order_index?: number;

  @IsArray() @IsOptional()
  options?: any[];

  @IsArray() @IsOptional()
  rows?: any[];

  @IsNumber() @IsOptional()
  number_min?: number;

  @IsNumber() @IsOptional()
  number_max?: number;

  @IsNumber() @IsOptional()
  number_step?: number;
}

export class CreateConsultantSurveyDto {
  @IsString() @MinLength(1)
  title_tr: string;

  @IsString() @IsOptional()
  title_en?: string;

  @IsString() @IsOptional()
  description_tr?: string;

  @IsString() @IsOptional()
  description_en?: string;

  @IsUUID()
  company_id: string;

  @IsIn(['once','weekly','monthly','quarterly','biannually','annually'])
  @IsOptional()
  frequency?: string;

  @IsBoolean() @IsOptional()
  is_anonymous?: boolean;

  @IsOptional()
  link_duration?: string | number;

  @IsInt() @IsOptional() @Min(1) @Max(90)
  throttle_days?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConsultantSurveyQuestionDto)
  questions: CreateConsultantSurveyQuestionDto[];
}
