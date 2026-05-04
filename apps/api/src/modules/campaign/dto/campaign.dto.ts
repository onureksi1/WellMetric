import { IsUUID, IsOptional, IsDateString, IsString, IsBoolean, IsArray, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCampaignDto {
  @IsUUID()
  survey_id: string;

  @IsOptional()
  @IsDateString()
  scheduled_at?: Date;

  @IsOptional()
  @IsBoolean()
  recipient_override?: boolean = false;

  @IsOptional()
  @IsString()
  recipient_csv_key?: string;

  @IsOptional()
  @IsBoolean()
  employee_accounts?: boolean = false;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  assignment_id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  period?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  target_employee_ids?: string[];

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  department_id?: string;
}

export class CampaignFilterDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  period?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  survey_id?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  per_page?: number = 20;
}

export class LogFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  per_page?: number = 50;
}

export class AdminStatsFilterDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;
}
