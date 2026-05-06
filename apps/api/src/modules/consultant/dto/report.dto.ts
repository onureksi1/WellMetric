import { IsString, IsUUID, MinLength, IsOptional, IsArray, Matches, IsIn } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateReportDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsUUID()
  company_id: string;

  @IsString()
  @MinLength(10)
  content: string; // markdown

  @IsString()
  @IsOptional()
  summary?: string; // max 300 karakter özet

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  period?: string; // '2026-05'

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  ai_insight_ids?: string[];
}


export class UpdateReportDto extends PartialType(CreateReportDto) {}

export class GenerateReportDto {
  @IsString()
  @IsUUID()
  company_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  period: string;

  @IsString()
  @IsIn(['tr', 'en'])
  @IsOptional()
  language?: 'tr' | 'en';
}
