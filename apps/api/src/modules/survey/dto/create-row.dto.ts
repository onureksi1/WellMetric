import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateRowDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(300)
  label_tr: string;

  @IsString()
  @IsOptional()
  label_en?: string;

  @IsString()
  @IsOptional()
  dimension?: string;

  @IsBoolean()
  @IsOptional()
  is_reversed?: boolean = false;

  @IsNumber()
  @IsOptional()
  weight?: number = 1.0;

  @IsNumber()
  @IsNotEmpty()
  order_index: number;
}
