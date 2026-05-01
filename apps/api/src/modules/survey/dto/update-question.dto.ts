import { IsString, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option.dto';
import { CreateRowDto } from './create-row.dto';

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  question_text_tr?: string;

  @IsString()
  @IsOptional()
  question_text_en?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  order_index?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  number_min?: number;

  @IsNumber()
  @IsOptional()
  number_max?: number;

  @IsNumber()
  @IsOptional()
  number_step?: number;

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
