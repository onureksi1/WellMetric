import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActionStatus } from './create-action.dto';

export class UpdateActionStatusDto {
  @ApiProperty({ enum: ActionStatus })
  @IsEnum(ActionStatus)
  status: ActionStatus;
}
