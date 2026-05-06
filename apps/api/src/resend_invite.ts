import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotificationService } from './modules/notification/notification.service';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationService = app.get(NotificationService);
  const dataSource = app.get(DataSource);

  const email = 'onur@3bitz.com';
  const consultantId = 'caed7502-8393-4421-9e3e-78cf340b52bd';

  console.log(`Resending invite to ${email}...`);

  const invitation = await dataSource.query(`
    SELECT token FROM invitations 
    WHERE user_id = $1 AND type = 'consultant_invite' 
    ORDER BY expires_at DESC LIMIT 1
  `, [consultantId]);

  if (invitation && invitation[0]) {
    await notificationService.sendConsultantWelcome(email, 'Onur Ekşi', invitation[0].token);
    console.log('Invite sent successfully!');
  } else {
    console.error('No valid invitation token found for this user.');
  }

  await app.close();
}

bootstrap();
