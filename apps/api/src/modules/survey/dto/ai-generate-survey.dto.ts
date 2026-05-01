import { IsString, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';

export class AiGenerateSurveyDto {
  @IsString()
  industry: string;

  @IsArray()
  dimensions: string[];

  @IsEnum(['tr', 'en'])
  language: 'tr' | 'en';

  @IsNumber()
  @Min(5)
  @Max(30)
  question_count: number;
}
