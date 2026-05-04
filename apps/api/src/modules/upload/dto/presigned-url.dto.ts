import { IsIn, IsInt, Min, IsOptional, IsString, IsUUID, Matches, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  LOGO = 'logo',
  CSV = 'csv',
  REPORT = 'report',
}

export class PresignedUrlDto {
  @ApiProperty({ enum: ['logo', 'csv', 'pdf'] })
  @IsIn(['logo', 'csv', 'pdf'])
  file_type: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime_type: string;

  @ApiProperty({ example: 102400 })
  @IsInt()
  @Min(1)
  @Max(20971520) // 20MB hard cap
  file_size: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({ example: '2026-04' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Dönem YYYY-MM formatında olmalıdır.' })
  period?: string;
}
