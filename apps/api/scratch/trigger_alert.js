const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');
const { AIService } = require('../src/modules/ai/ai.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AIService);

  const companyId = '5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5'; // Onur Tech
  const period = '2026-05';

  console.log('Generating risk alert for Onur Tech - Social dimension...');
  
  await aiService.generateRiskAlert(
    companyId,
    null,
    'social',
    40,
    null,
    period
  );

  console.log('Risk alert generated successfully.');
  await app.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
