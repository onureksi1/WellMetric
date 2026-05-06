import { IsString, IsOptional, IsIn, IsUrl, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateContentItemDto {
  @IsString()
  @MinLength(3)
  title_tr: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  description_tr?: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @IsIn(['webinar', 'pdf', 'video', 'article', 'template'])
  type: string;

  @IsIn(['physical', 'mental', 'social', 'financial', 'work'])
  @IsOptional()
  dimension?: string;

  @IsUrl()
  url_tr: string;

  @IsUrl()
  @IsOptional()
  url_en?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  score_threshold?: number;
}
