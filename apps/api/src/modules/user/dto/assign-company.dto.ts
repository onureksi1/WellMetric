import { IsUUID, IsOptional } from 'class-validator';

export class AssignCompanyDto {
  @IsUUID()
  company_id: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;
}
