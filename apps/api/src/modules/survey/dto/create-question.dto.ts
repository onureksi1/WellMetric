import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option.dto';
import { CreateRowDto } from './create-row.dto';

export enum DimensionType {
  PHYSICAL = 'physical',
  MENTAL = 'mental',
  SOCIAL = 'social',
  FINANCIAL = 'financial',
  WORK = 'work',
  OVERALL = 'overall',
}

export enum QuestionType {
  LIKERT5 = 'likert5',
  LIKERT10 = 'likert10',
  STAR_RATING = 'star_rating',
  YES_NO = 'yes_no',
  NPS = 'nps',
  NUMBER_INPUT = 'number_input',
  SINGLE_CHOICE = 'single_choice',
  MULTI_CHOICE = 'multi_choice',
  RANKING = 'ranking',
  MATRIX = 'matrix',
  OPEN_TEXT = 'open_text',
}

export class CreateQuestionDto {
  @IsEnum(DimensionType)
  @IsNotEmpty()
  dimension: DimensionType;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  question_text_tr: string;

  @IsString()
  @IsOptional()
  question_text_en?: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  question_type: QuestionType;

  @IsBoolean()
  @IsOptional()
  is_reversed?: boolean = false;

  @IsNumber()
  @Min(0.1)
  @Max(3.0)
  @IsOptional()
  weight?: number = 1.0;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean = true;

  @IsNumber()
  @IsOptional()
  number_min?: number;

  @IsNumber()
  @IsOptional()
  number_max?: number;

  @IsNumber()
  @IsOptional()
  number_step?: number = 1;

  @IsString()
  @IsOptional()
  matrix_label_tr?: string;

  @IsString()
  @IsOptional()
  matrix_label_en?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRowDto)
  rows?: CreateRowDto[];
}
