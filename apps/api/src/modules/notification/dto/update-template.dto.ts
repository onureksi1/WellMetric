import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(300)
  subject_tr?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  subject_en?: string;

  @IsString()
  @IsOptional()
  @MinLength(50)
  body_tr?: string;

  @IsString()
  @IsOptional()
  body_en?: string;
}
