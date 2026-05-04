import { PartialType, OmitType } from '@nestjs/mapped-types';
import { InviteUserDto } from './invite-user.dto';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(OmitType(InviteUserDto, ['email', 'department_id'] as const)) {
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value === '' ? undefined : value)
  department_id?: string;
}
