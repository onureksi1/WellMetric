import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateDemoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  full_name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(200)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  company_name: string;

  @IsOptional()
  @IsEnum(['1-50', '51-250', '251-1000', '1000+'])
  company_size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  user_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
