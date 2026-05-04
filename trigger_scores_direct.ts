import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { ScoreService } from './apps/api/src/modules/score/score.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scoreService = app.get(ScoreService);
  console.log('Triggering score calculation directly...');
  await scoreService.calculateAndStore('5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5', '73f06599-8dcb-4dbf-9167-c3b61bf79896', '2026-05');
  console.log('Done!');
  await app.close();
  process.exit(0);
}
bootstrap();
