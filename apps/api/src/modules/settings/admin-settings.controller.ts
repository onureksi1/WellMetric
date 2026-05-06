import {
  Controller,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSettingsController {}
