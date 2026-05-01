import { Controller, Get, Query } from '@nestjs/common';
import { INDUSTRIES } from '@wellanalytics/shared';

@Controller('industries')
export class IndustriesController {
  @Get()
  findAll(@Query('lang') lang: 'tr' | 'en' = 'tr') {
    return INDUSTRIES.map((industry) => ({
      value: industry.value,
      label: lang === 'en' ? industry.label_en : industry.label_tr,
    }));
  }
}
