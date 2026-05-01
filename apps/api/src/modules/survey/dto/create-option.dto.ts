import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(300)
  label_tr: string;

  @IsString()
  @IsOptional()
  label_en?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  value: number;

  @IsNumber()
  @IsNotEmpty()
  order_index: number;
}
