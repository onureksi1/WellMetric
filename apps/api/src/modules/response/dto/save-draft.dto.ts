import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveDraftDto {
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, any>;
}
