import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Dimension } from '../../content/dto/create-content.dto';

export enum ActionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateActionDto {
  @ApiProperty({ example: 'Mental Sağlık Atölyesi', minLength: 3, maxLength: 300 })
  @IsString()
  @Length(3, 300)
  title: string;

  @ApiPropertyOptional({ example: 'Çalışanlar için stres yönetimi atölyesi.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: Dimension })
  @IsEnum(Dimension)
  dimension: Dimension;

  @ApiPropertyOptional({ example: 'uuid-of-department' })
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiPropertyOptional({ example: 'uuid-of-content-item' })
  @IsUUID()
  @IsOptional()
  content_item_id?: string;

  @ApiPropertyOptional({ example: '2026-05-30' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ enum: ActionStatus, default: ActionStatus.PLANNED })
  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus = ActionStatus.PLANNED;
}
