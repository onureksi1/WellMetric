import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SettingsService } from '../modules/settings/settings.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const settingsService = app.get(SettingsService);

  const dto = {
    mail_provider: 'smtp',
    mail_config: {
      host: 'mail.mwacademia.com',
      user: 'test@mwacademia.com',
      port: 465,
      pass: 'exhe40241000'
    },
    mail_from_address: null,
    mail_from_name: null
  };

  const adminUserId = '5ca832cf-44d1-4a53-8b5a-7ced450bc042';

  try {
    console.log('Testing settings update...');
    const result = await settingsService.updateSettings(dto as any, adminUserId);
    console.log('Update successful:', result);
  } catch (error) {
    console.error('Update failed with error:');
    console.error(error);
    if (error.response) {
      console.error('Error response:', error.response);
    }
  } finally {
    await app.close();
  }
}

test();
