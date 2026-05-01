import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  platform_name?: string;

  @IsNumber()
  @IsOptional()
  anonymity_threshold?: number;
}
