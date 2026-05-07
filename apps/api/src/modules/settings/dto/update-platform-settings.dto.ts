import { IsBoolean, IsEmail, IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min, IsInt, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export enum MailProvider {
  RESEND = 'resend',
  SENDGRID = 'sendgrid',
  AWS_SES = 'aws_ses',
  SMTP = 'smtp',
}

export enum StorageProvider {
  CLOUDFLARE_R2 = 'cloudflare_r2',
  AWS_S3 = 'aws_s3',
  MINIO = 'minio',
  LOCAL = 'local',
}

export class UpdatePlatformSettingsDto {
  @IsString()
  @IsOptional()
  platform_name?: string;

  @IsString()
  @IsOptional()
  platform_url?: string;

  @IsString()
  @IsOptional()
  platform_logo_url?: string;

  @IsNumber()
  @Min(3)
  @Max(20)
  @IsOptional()
  @Type(() => Number)
  anonymity_threshold?: number;

  @IsNumber()
  @Min(20)
  @Max(80)
  @IsOptional()
  @Type(() => Number)
  score_alert_threshold?: number;

  @IsBoolean()
  @IsOptional()
  ai_enabled?: boolean;

  @IsNumber()
  @Min(500)
  @Max(4000)
  @IsOptional()
  ai_max_tokens?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  ai_temperature?: number;

  @IsEnum(MailProvider)
  @IsOptional()
  mail_provider?: MailProvider;

  @IsEmail()
  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null)
  mail_from_address?: string;

  @IsString()
  @IsOptional()
  mail_from_name?: string;

  @IsObject()
  @IsOptional()
  mail_config?: any;

  @IsEnum(StorageProvider)
  @IsOptional()
  storage_provider?: StorageProvider;

  @IsObject()
  @IsOptional()
  storage_config?: any;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mail_quota_capacity?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mail_quota_used?: number;

  @IsObject()
  @IsOptional()
  consultant_packages?: any;

  @IsString()
  @IsOptional()
  terms_of_use_tr?: string;

  @IsString()
  @IsOptional()
  terms_of_use_en?: string;

  @IsString()
  @IsOptional()
  privacy_policy_tr?: string;

  @IsString()
  @IsOptional()
  privacy_policy_en?: string;

  @IsString()
  @IsOptional()
  kvkk_text_tr?: string;

  @IsString()
  @IsOptional()
  gdpr_text_en?: string;

  @IsEmail()
  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null)
  admin_email?: string;

  @IsBoolean()
  @IsOptional()
  debug_mode?: boolean;
}
