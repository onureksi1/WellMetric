import { IsUUID, IsOptional, IsDateString, IsString, IsBoolean, IsEnum, IsNumber } from 'class-validator';

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
  assignment_id?: string;

  @IsOptional()
  @IsString()
  period?: string;
}

export class CampaignFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsUUID()
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
