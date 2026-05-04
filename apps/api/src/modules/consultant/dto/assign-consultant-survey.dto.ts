import { IsArray, IsDateString, IsString, IsUUID, Matches } from 'class-validator';

export class AssignConsultantSurveyDto {
  @IsUUID()
  survey_id: string;

  @IsArray() @IsUUID('4', { each: true })
  company_ids: string[];

  @IsString() @Matches(/^\d{4}-\d{2}$/)
  period: string;

  @IsDateString()
  due_at: string;
}
