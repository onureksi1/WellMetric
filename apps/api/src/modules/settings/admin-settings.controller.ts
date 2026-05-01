import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('packages')
  getPackages() {
    return this.settingsService.getPackages();
  }

  @Put('packages')
  updatePackages(
    @Body() packages: any,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updatePackages(packages, user.id);
  }
}
