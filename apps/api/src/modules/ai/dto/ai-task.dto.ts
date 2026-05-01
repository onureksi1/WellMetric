import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class AiTaskDto {
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;
}
