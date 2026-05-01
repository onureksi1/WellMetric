
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { CompanyService } from '../apps/api/src/modules/company/company.service';

async function check() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const companyService = app.get(CompanyService);
  
  console.log('Testing findAll...');
  const result = await companyService.findAll({});
  console.log('Result count:', result.data.length);
  console.log('Result total:', result.meta.total);
  console.log('First company:', JSON.stringify(result.data[0], null, 2));
  
  await app.close();
}

check().catch(console.error);
