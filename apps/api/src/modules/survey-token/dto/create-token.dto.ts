import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTokenDto {
  @IsUUID()
  @IsNotEmpty()
  survey_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDateString()
  @IsNotEmpty()
  expires_at: string;
}
