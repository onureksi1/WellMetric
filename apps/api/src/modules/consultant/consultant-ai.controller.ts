import { Controller, Post, Body, UseGuards, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultantService } from './consultant.service';
import { BillingService } from '../billing/services/billing.service';
import { AIService } from '../ai/ai.service';
import { ComparativeInsightDto, IntelligenceReportDto } from './dto/consultant-ai.dto';

@ApiTags('Consultant AI')
@Controller('consultant/ai')
@UseGuards(JwtAuthGuard, ConsultantGuard)
@ApiBearerAuth()
export class ConsultantAIController {
  constructor(
    private readonly consultantService: ConsultantService,
    private readonly billingService: BillingService,
    private readonly aiService: AIService,
  ) {}

  @Post('comparative-insight')
  @ApiOperation({ summary: 'Generate comparative AI insight for multiple companies' })
  async comparativeInsight(
    @Body() dto: ComparativeInsightDto,
    @CurrentUser() user: any,
  ) {
    // 1. Ownership check: Ensure all company_ids belong to this consultant
    for (const companyId of dto.company_ids) {
      await this.consultantService.verifyOwnership(user.id, companyId);
    }

    // 2. Credit check & consume: 5 AI credits
    await this.billingService.consumeCredits(user.id, 'ai_credit', 5, 'Comparative AI Insight');

    // 3. Generate insight
    return this.aiService.generateComparativeInsight({
      company_ids: dto.company_ids,
      period: dto.period,
      consultant_id: user.id,
    });
  }

  @Post('intelligence-report/:companyId')
  @ApiOperation({ summary: 'Generate deep intelligence report for a company' })
  async intelligenceReport(
    @Param('companyId') companyId: string,
    @Body() dto: IntelligenceReportDto,
    @CurrentUser() user: any,
  ) {
    // 1. Ownership check
    await this.consultantService.verifyOwnership(user.id, companyId);

    // 2. Credit check & consume: 10 AI credits
    await this.billingService.consumeCredits(user.id, 'ai_credit', 10, `Intelligence Report: ${companyId}`);

    // 3. Generate report
    return this.aiService.generateIntelligenceReport(companyId, dto.period);
  }
}
