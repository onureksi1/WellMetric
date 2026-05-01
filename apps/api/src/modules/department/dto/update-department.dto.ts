import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name: string;
}
