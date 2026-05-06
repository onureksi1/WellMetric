import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const queue = app.get<Queue>(getQueueToken('mail-queue'));

  const counts = await queue.getJobCounts();
  console.log('Mail Queue Job Counts:', JSON.stringify(counts, null, 2));

  const failedJobs = await queue.getFailed();
  console.log('Failed Jobs Count:', failedJobs.length);
  if (failedJobs.length > 0) {
    console.log('Last Failed Job Error:', failedJobs[0].failedReason);
  }

  await app.close();
}

bootstrap();
