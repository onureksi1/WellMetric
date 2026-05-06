import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultantReportsService } from './consultant-reports.service';
import { CreateReportDto, UpdateReportDto, GenerateReportDto } from './dto/report.dto';
import { AIReportService } from '../ai/ai-report.service';
import { Company } from '../company/entities/company.entity';

@Controller('consultant/reports')
@UseGuards(JwtAuthGuard, ConsultantGuard)
export class ConsultantReportsController {
  constructor(
    private readonly reportsService: ConsultantReportsService,
    private readonly aiReportService: AIReportService,
    @InjectQueue('ai-queue')
    private readonly aiQueue: Queue,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('id') consultantId: string,
    @Res() res: any,
  ) {
    const pdfBuffer = await this.reportsService.generatePdf(id, consultantId);
    
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="wellbeing-raporu-${id}.pdf"`,
      'Content-Length':      String(pdfBuffer.length),
    });
    res.end(pdfBuffer);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('company_id') companyId?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.findAll(user.id, { company_id: companyId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
    return this.reportsService.create(dto, user.id);
  }

  // POST /consultant/reports/generate
  @Post('generate')
  async generateAiReport(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    console.log('[ConsultantReports.generate]', {
      userId:    user.id,
      companyId: dto.company_id,
      period:    dto.period,
    });

    // Firma ownership kontrolü
    const company = await this.companyRepo.findOne({
      where: { id: dto.company_id, consultant_id: user.id }
    });
    if (!company) throw new ForbiddenException('Bu firmaya erişim yetkiniz yok');

    // Kapsamlı rapor üretimini kuyruğa at
    await this.aiQueue.add('generate_consultant_report', {
      companyId:    dto.company_id,
      consultantId: user.id,
      period:       dto.period,
      language:     dto.language ?? 'tr',
    });
    
    return {
      message:   'Rapor talebi alındı. Hazırlandığında size e-posta ile bildireceğiz. Raporlarım sayfasından takip edebilirsiniz.',
      status:    'processing'
    };
  }

  @Post('from-insights')
  createFromInsights(
    @Body() body: { insight_ids: string[] } & CreateReportDto,
    @CurrentUser() user: any,
  ) {
    const { insight_ids, ...dto } = body;
    return this.reportsService.createFromInsights(insight_ids, dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.update(id, dto, user.id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.publish(id, user.id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.unpublish(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.remove(id, user.id);
  }
}
