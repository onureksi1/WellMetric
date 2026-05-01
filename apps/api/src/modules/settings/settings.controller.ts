import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateApiKeysDto } from './dto/update-api-keys.dto';
import { UpdateAiModelsDto } from './dto/update-ai-models.dto';
import { TestMailDto } from './dto/test-mail.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSettings(dto, user.id);
  }

  @Put('api-keys')
  updateApiKeys(
    @Body() dto: UpdateApiKeysDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateApiKeys(dto, user.id);
  }

  @Patch('ai-models')
  updateAiModels(
    @Body() dto: UpdateAiModelsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateAiModels(dto, user.id);
  }

  @Post('mail/test')
  testMail(@Body() dto: TestMailDto) {
    return this.settingsService.testMail(dto);
  }

  @Post('storage/test')
  testStorage() {
    return this.settingsService.testStorage();
  }

  @Get('payment-providers')
  getPaymentProviders() {
    return this.settingsService.getPaymentProviders();
  }
}
