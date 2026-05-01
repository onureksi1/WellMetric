import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditFilterDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  target_type?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  @Type(() => Number)
  per_page?: number = 100;
}
