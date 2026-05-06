import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UploadContext {
  LOGO = 'logo',
  CSV = 'csv',
  REPORT = 'report',
  PLATFORM_LOGO = 'platform_logo',
}

export class ConfirmUploadDto {
  @ApiProperty({ example: 'logos/company-uuid/logo.png' })
  @IsString()
  @Length(1, 500)
  s3_key: string;

  @ApiProperty({ enum: UploadContext })
  @IsEnum(UploadContext)
  context: UploadContext;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  entity_id?: string;
}
