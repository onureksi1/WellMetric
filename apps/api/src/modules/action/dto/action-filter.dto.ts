import { IsEnum, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActionStatus } from './create-action.dto';
import { Dimension } from '../../content/dto/create-content.dto';

export class ActionFilterDto {
  @ApiPropertyOptional({ enum: ActionStatus })
  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus;

  @ApiPropertyOptional({ enum: Dimension })
  @IsEnum(Dimension)
  @IsOptional()
  dimension?: Dimension;

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

  @ApiPropertyOptional({ default: 50 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  per_page?: number = 50;
}
