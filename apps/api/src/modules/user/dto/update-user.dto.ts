import { PartialType, OmitType } from '@nestjs/mapped-types';
import { InviteUserDto } from './invite-user.dto';

export class UpdateUserDto extends PartialType(OmitType(InviteUserDto, ['email'] as const)) {}
