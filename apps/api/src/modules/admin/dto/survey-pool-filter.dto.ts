import { IsOptional, IsUUID, IsString, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SurveyPoolFilterDto {
  @IsOptional() @IsUUID() consultant_id?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsIn(['physical','mental','social','financial','work'])
  dimension?: string;
  @IsOptional() @IsDateString() date_from?: string;
  @IsOptional() @IsDateString() date_to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
}
