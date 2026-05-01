import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class TestTemplateDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsEnum(['tr', 'en'])
  @IsOptional()
  language?: 'tr' | 'en' = 'tr';
}
