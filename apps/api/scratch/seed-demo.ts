import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DemoRequest } from '../src/modules/demo/entities/demo.entity';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const demoRepository = app.get<Repository<DemoRequest>>(getRepositoryToken(DemoRequest));

  const demoData = [
    {
      full_name: 'Ahmet Yılmaz',
      email: 'ahmet@teknoas.com',
      company_name: 'TeknoAS Yazılım',
      company_size: '50-100',
      industry: 'Teknoloji',
      phone: '0532 111 22 33',
      message: 'Platformu ekibimiz için denemek istiyoruz.',
      status: 'pending',
    },
    {
      full_name: 'Zeynep Kaya',
      email: 'z.kaya@finansbank.com',
      company_name: 'QNB Finansbank',
      company_size: '1000+',
      industry: 'Finans',
      phone: '0212 333 44 55',
      message: 'Kurumsal esenlik çözümlerinizle ilgileniyoruz.',
      status: 'contacted',
    },
    {
      full_name: 'Mehmet Demir',
      email: 'm.demir@koctas.com',
      company_name: 'Koçtaş',
      company_size: '500-1000',
      industry: 'Perakende',
      phone: '0544 555 66 77',
      message: 'Demo sunumu için uygun zamanınızı bekliyoruz.',
      status: 'pending',
    },
    {
      full_name: 'Ayşe Öztürk',
      email: 'ayse@globalgroup.io',
      company_name: 'Global Group',
      company_size: '250-500',
      industry: 'Danışmanlık',
      phone: '0216 777 88 99',
      message: 'Yeni projelerimizde wellbeing entegrasyonu düşünüyoruz.',
      status: 'converted',
    }
  ];

  for (const data of demoData) {
    const exists = await demoRepository.findOne({ where: { email: data.email } });
    if (!exists) {
      await demoRepository.save(demoRepository.create(data));
      console.log(`Seeded demo request for ${data.full_name}`);
    }
  }

  await app.close();
}

seed();
