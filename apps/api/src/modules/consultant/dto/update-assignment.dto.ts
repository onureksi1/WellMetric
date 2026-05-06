import { IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class UpdateAssignmentDto {
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
