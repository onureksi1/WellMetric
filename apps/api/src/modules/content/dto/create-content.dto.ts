import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentType {
  WEBINAR = 'webinar',
  PDF = 'pdf',
  VIDEO = 'video',
  ARTICLE = 'article',
  TEMPLATE = 'template',
}

export enum Dimension {
  PHYSICAL = 'physical',
  MENTAL = 'mental',
  SOCIAL = 'social',
  FINANCIAL = 'financial',
  WORK = 'work',
}

export class CreateContentDto {
  @ApiProperty({ example: 'Sağlıklı Beslenme Rehberi', minLength: 3, maxLength: 300 })
  @IsString()
  @Length(3, 300)
  title_tr: string;

  @ApiPropertyOptional({ example: 'Healthy Nutrition Guide' })
  @IsString()
  @IsOptional()
  title_en?: string;

  @ApiPropertyOptional({ example: 'Beslenme üzerine ipuçları...' })
  @IsString()
  @IsOptional()
  description_tr?: string;

  @ApiPropertyOptional({ example: 'Tips on nutrition...' })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ enum: Dimension })
  @IsEnum(Dimension)
  dimension: Dimension;

  @ApiProperty({ example: 'https://wellanalytics.io/content/tr/guide.pdf' })
  @IsUrl()
  url_tr: string;

  @ApiPropertyOptional({ example: 'https://wellanalytics.io/content/en/guide.pdf' })
  @IsUrl()
  @IsOptional()
  url_en?: string;

  @ApiPropertyOptional({ default: 50, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score_threshold?: number = 50;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;
}
