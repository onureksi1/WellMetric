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
    console.log('[ConsultantReportsController.findAll] User:', user.id);
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

    // 1. Create a 'generating' placeholder record immediately
    let reportId: string;
    try {
      const insertResult = await this.dataSource.query(`
        INSERT INTO consultant_reports (
          id, consultant_id, company_id, title, status, period, 
          assessment_model, reference_assessment_model, content,
          created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [
        user.id,
        dto.company_id,
        `${company.name} Esenlik Raporu`,
        'generating',
        dto.period || new Date().toISOString().slice(0, 7),
        dto.assessment_model || 'wellbeing_metric',
        dto.reference_assessment_model || null,
        'Rapor hazırlanıyor, lütfen bekleyin...'
      ]);
      reportId = insertResult[0].id;
      console.log('[ConsultantReportsController] Placeholder successfully created:', reportId);
    } catch (error) {
      console.error('[ConsultantReportsController] CRITICAL: Placeholder failed:', error.message);
      // Fallback: Using basic TypeORM save with all columns
      const fallbackReport = this.reportRepo.create({
        consultantId: user.id,
        companyId: dto.company_id,
        title: `${company.name} Esenlik Raporu`,
        status: 'generating' as any,
        period: dto.period,
        assessment_model: dto.assessment_model,
        reference_assessment_model: dto.reference_assessment_model,
        content: 'Rapor hazırlanıyor...'
      });
      const saved = await this.reportRepo.save(fallbackReport);
      reportId = saved.id;
    }

    // 2. Kuyruğa at (reportId'yi de gönder)
    await this.aiQueue.add('generate_consultant_report', {
      reportId:     reportId,
      companyId:    dto.company_id,
      consultantId: user.id,
      period:       dto.period,
      language:     dto.language ?? 'tr',
      assessmentModel: dto.assessment_model,
      referenceModel:  dto.reference_assessment_model,
    });
    
    return {
      message:   'Rapor üretimi başlatıldı. "Raporlarım" sayfasından takip edebilirsiniz.',
      reportId:  reportId,
      status:    'generating'
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
