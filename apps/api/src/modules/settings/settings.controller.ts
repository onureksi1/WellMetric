import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateApiKeysDto } from './dto/update-api-keys.dto';
import { UpdateAiModelsDto } from './dto/update-ai-models.dto';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';
import { TestMailDto } from './dto/test-mail.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSettings(dto, user.id);
  }

  @Put('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateApiKeys(
    @Body() dto: UpdateApiKeysDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateApiKeys(dto, user.id);
  }

  @Patch('ai-models')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateAiModels(
    @Body() dto: UpdateAiModelsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateAiModels(dto, user.id);
  }

  @Post('mail/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  testMail(@Body() dto: TestMailDto) {
    return this.settingsService.testMail(dto);
  }

  @Post('storage/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  testStorage() {
    return this.settingsService.testStorage();
  }

  @Get('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @Put('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updatePaymentSettings(
    @Body() dto: UpdatePaymentSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updatePaymentSettings(dto, user.id);
  }

  @Patch('payment/providers/:provider/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  toggleProvider(
    @Param('provider') provider: string,
    @Body('is_active') isActive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.togglePaymentProvider(provider, isActive, user.id);
  }

  @Get('payment-providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'consultant')
  getPaymentProviders() {
    return this.settingsService.getPaymentProviders();
  }

  @Get('active-providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'consultant')
  getActiveProviders() {
    return this.settingsService.getActiveProviders();
  }
}
