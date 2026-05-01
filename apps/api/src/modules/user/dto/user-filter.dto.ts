import { IsOptional, IsUUID, IsBoolean, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSeniority } from './invite-user.dto';

export class UserFilterDto {
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsString()
  @IsOptional()
  role?: string;

  @IsEnum(UserSeniority)
  @IsOptional()
  seniority?: UserSeniority;

  @IsString()
  @IsOptional()
  location?: string;
  
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  per_page?: number = 50;
}
