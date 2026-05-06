import { IsString, IsUUID, IsOptional, IsDateString, IsIn, IsInt, MinLength, IsArray, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTrainingPlanDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsUUID()
  company_id: string;

  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  starts_at?: string;

  @IsDateString()
  @IsOptional()
  ends_at?: string;
}

export class UpdateTrainingPlanDto extends PartialType(CreateTrainingPlanDto) {}

export class CreateTrainingEventDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsUUID()
  company_id: string;

  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['session', 'webinar', 'workshop', 'reading', 'task'])
  @IsOptional()
  event_type?: string;

  @IsDateString()
  scheduled_at: string; // ISO: '2026-05-15T14:00:00'

  @IsInt()
  @IsOptional()
  duration_minutes?: number;

  @IsUUID()
  @IsOptional()
  content_item_id?: string;

  @IsString()
  @IsOptional()
  external_url?: string;

  @IsString()
  @IsOptional()
  external_url_label?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

export class UpdateTrainingEventDto extends PartialType(CreateTrainingEventDto) {}

export class SendNotificationDto {
  @IsIn(['company', 'department'])
  target: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  extra_emails?: string[];
}
