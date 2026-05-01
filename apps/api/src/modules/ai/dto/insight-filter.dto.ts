import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum InsightType {
  OPEN_TEXT_SUMMARY = 'open_text_summary',
  RISK_ALERT = 'risk_alert',
  ACTION_SUGGESTION = 'action_suggestion',
  TREND_ANALYSIS = 'trend_analysis',
  HR_CHAT = 'hr_chat',
  ADMIN_ANOMALY = 'admin_anomaly',
  ADMIN_CHAT = 'admin_chat',
}

export class InsightFilterDto {
  @ApiPropertyOptional({ enum: InsightType })
  @IsEnum(InsightType)
  @IsOptional()
  insight_type?: InsightType;

  @ApiPropertyOptional({ example: '2026-04' })
  @IsString()
  @IsOptional()
  period?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  per_page?: number = 20;
}
