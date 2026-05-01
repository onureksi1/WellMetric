import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ReportLanguage {
  TR = 'tr',
  EN = 'en',
}

export class ExportReportDto {
  @ApiProperty({ example: '2026-04' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Dönem YYYY-MM formatında olmalıdır (örn: 2026-04).',
  })
  period: string;

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ enum: ReportLanguage })
  @IsEnum(ReportLanguage)
  @IsOptional()
  language?: ReportLanguage;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  company_id?: string;
}
