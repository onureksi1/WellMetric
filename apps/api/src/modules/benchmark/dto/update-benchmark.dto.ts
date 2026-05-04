import { IsString, IsIn, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpdateBenchmarkDto {
  @IsString()
  industry: string;

  @IsIn(['global', 'turkey'])
  region: string;

  @IsIn(['overall', 'physical', 'mental', 'social', 'financial', 'work'])
  dimension: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @IsOptional()
  source?: string;
}
