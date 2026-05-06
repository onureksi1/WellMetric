import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDemoStatusDto {
  @IsEnum(['pending', 'contacted', 'done', 'converted', 'rejected'])
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
