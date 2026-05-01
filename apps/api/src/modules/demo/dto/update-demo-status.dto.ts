import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDemoStatusDto {
  @IsEnum(['pending', 'contacted', 'demo_done', 'converted', 'rejected'])
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
