import { IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  full_name?: string;

  @IsEnum(['tr', 'en'])
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  notification_email?: boolean;

  @IsBoolean()
  @IsOptional()
  notification_reminder?: boolean;
}
