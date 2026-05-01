import { IsObject, IsString } from 'class-validator';

export class UpdateApiKeysDto {
  @IsString()
  provider: string;

  @IsObject()
  config: any;
}
