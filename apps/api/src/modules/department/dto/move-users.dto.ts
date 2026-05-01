import { IsNotEmpty, IsUUID } from 'class-validator';

export class MoveUsersDto {
  @IsUUID()
  @IsNotEmpty()
  target_department_id: string;
}
