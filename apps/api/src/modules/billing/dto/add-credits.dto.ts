import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class AddCreditsDto {
  @IsString()
  credit_type_key: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
