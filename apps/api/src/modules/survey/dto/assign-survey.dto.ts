import { IsNotEmpty, IsUUID, IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class AssignSurveyDto {
  @IsArray()
  @IsOptional()
  company_ids: string[] | null;

  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsNotEmpty()
  period: string;

  @IsDateString()
  @IsNotEmpty()
  due_at: string;
}
