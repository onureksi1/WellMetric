import {
  IsOptional,
  IsString,
  Matches,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  months?: number = 12;

  @IsOptional()
  @IsUUID()
  department_id?: string;
}
