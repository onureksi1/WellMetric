import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignContentDto {
  @IsUUID()
  content_item_id: string;

  @IsUUID()
  company_id: string;

  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
