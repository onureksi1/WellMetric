import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { ScoreService } from './apps/api/src/modules/score/score.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scoreService = app.get(ScoreService);
  console.log('Triggering score recalculation...');
  await scoreService.recalculateScores();
  console.log('Done!');
  await app.close();
  process.exit(0);
}
bootstrap();
