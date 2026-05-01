import { IsUUID, IsNumber, IsString, IsOptional, ValidateNested, IsArray, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class MatrixRowAnswer {
  @IsUUID()
  @IsNotEmpty()
  row_id: string;

  @IsNumber()
  @IsNotEmpty()
  value: number; // 1-5 likert
}

export class AnswerItemDto {
  @IsUUID()
  @IsNotEmpty()
  question_id: string;

  @IsNumber()
  @IsOptional()
  answer_value?: number;

  @IsNumber()
  @IsOptional()
  answer_number?: number;

  @IsString()
  @IsOptional()
  answer_text?: string;

  @IsUUID()
  @IsOptional()
  answer_option_id?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  answer_option_ids?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  answer_ranking?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatrixRowAnswer)
  @IsOptional()
  answer_matrix?: MatrixRowAnswer[];
}

export class SubmitResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
