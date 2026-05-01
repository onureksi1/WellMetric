import { IsArray, ValidateNested, IsUUID, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOrderDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  order_index: number;
}

export class ReorderQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[];
}
