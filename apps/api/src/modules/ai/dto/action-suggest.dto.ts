import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Dimension {
  PHYSICAL = 'physical',
  MENTAL = 'mental',
  SOCIAL = 'social',
  FINANCIAL = 'financial',
  WORK = 'work',
}

export class ActionSuggestDto {
  @ApiProperty({ enum: Dimension })
  @IsEnum(Dimension)
  dimension: Dimension;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiPropertyOptional({ example: '2026-04' })
  @IsString()
  @IsOptional()
  period?: string;
}
