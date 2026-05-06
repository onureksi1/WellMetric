import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { ConsultantService } from '../apps/api/src/modules/consultant/consultant.service';

async function debug() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ConsultantService);
  
  const consultantId = 'caed7502-8393-4421-9e3e-78cf340b52bd';
  const companies = await service.getCompanies(consultantId, {});
  
  console.log('COMPANIES FOR CONSULTANT:', JSON.stringify(companies, null, 2));
  
  await app.close();
}

debug();
