import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsUUID()
  @IsOptional()
  department_id?: string;
}
