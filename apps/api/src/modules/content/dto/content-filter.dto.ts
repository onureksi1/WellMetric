import { IsEnum, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType, Dimension } from './create-content.dto';

export class ContentFilterDto {
  @ApiPropertyOptional({ enum: ContentType })
  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @ApiPropertyOptional({ enum: Dimension })
  @IsEnum(Dimension)
  @IsOptional()
  dimension?: Dimension;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;

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
