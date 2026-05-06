import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SettingsService } from './modules/settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const settingsService = app.get(SettingsService);

  const config = await settingsService.getDecryptedMailConfig();
  console.log('Decrypted Mail Config:', JSON.stringify(config, null, 2));
  console.log('Has API Key:', !!config?.api_key);

  const settings = await settingsService.getSettings(false);
  console.log('Raw Mail Config from Settings:', JSON.stringify(settings.mail_config, null, 2));

  await app.close();
}

bootstrap();
