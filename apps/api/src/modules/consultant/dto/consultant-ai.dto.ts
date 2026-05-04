import { IsArray, IsString, Matches, IsUUID } from 'class-validator';

export class ComparativeInsightDto {
  @IsArray()
  @IsUUID('4', { each: true })
  company_ids: string[];

  @IsString()
  @Matches(/^\d{4}-\d{2}$/) // "2026-04" format
  period: string;
}

export class IntelligenceReportDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  period: string;
}
