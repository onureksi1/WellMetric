import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ChatDto } from './dto/chat.dto';
import { ActionSuggestDto } from './dto/action-suggest.dto';
import { InsightFilterDto } from './dto/insight-filter.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('AI')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly aiService: AIService,
    @InjectQueue('ai-queue') private readonly aiQueue: Queue,
  ) {}

  // ── Super Admin Routes ──────────────────────────────────────────────
  
  @Post('admin/ai/chat')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Chat with AI as Super Admin (Platform wide context)' })
  adminChat(@Body() dto: ChatDto, @Req() req: any) {
    const language = req.user.language || 'tr';
    return this.aiService.adminChat(dto.message, dto.conversation_history || [], language);
  }

  @Post('admin/ai/anomaly')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Trigger anomaly analysis for all companies' })
  async triggerAnomaly(@Query('period') period: string, @Req() req: any) {
    const language = req.user.language || 'tr';
    await this.aiQueue.add('admin_anomaly', { period, language });
    return { status: 'accepted', message: 'Anomali analizi başlatıldı.' };
  }

  @Get('admin/ai/insights')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all AI insights (Super Admin)' })
  getAdminInsights(@Query() filters: any) {
    const companyId = filters.company_id || null;
    return this.aiService.getInsights(companyId, filters);
  }

  // ── HR Admin Routes ─────────────────────────────────────────────────

  @Post('hr/ai/chat')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Chat with AI as HR Admin (Company specific context)' })
  hrChat(@Body() dto: ChatDto, @Req() req: any) {
    const language = req.user.language || 'tr';
    return this.aiService.hrChat(req.user.company_id, dto.message, dto.conversation_history || [], language);
  }

  @Get('hr/ai/insights')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get company AI insights' })
  getHrInsights(@Req() req: any, @Query() filters: InsightFilterDto) {
    return this.aiService.getInsights(req.user.company_id, filters);
  }

  @Post('hr/ai/action-suggest')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get AI powered action suggestions (Synchronous)' })
  actionSuggest(@Req() req: any, @Body() dto: ActionSuggestDto) {
    const language = req.user.language || 'tr';
    return this.aiService.generateActionSuggestion(
      req.user.company_id,
      dto.dimension,
      50, // Default score to suggest for, could be improved to fetch actual
      dto.department_id,
      dto.period,
      language
    );
  }

  @Post('hr/ai/intelligence-report')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Request an intelligence report for a specific period' })
  async requestIntelligenceReport(@Req() req: any, @Body() dto: { period: string }) {
    const language = req.user.language || 'tr';
    const period = dto.period || new Date().toISOString().slice(0, 7);
    
    await this.aiQueue.add('intelligence_report', {
      companyId: req.user.company_id,
      period,
      language
    }, {
      timeout: 120000, // 2 minutes
      attempts: 2
    });

    return { status: 'accepted', message: 'İstihbarat raporu hazırlanıyor. Yaklaşık 1-2 dakika sürebilir.' };
  }

  @Get('hr/ai/intelligence-report/:period')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get existing intelligence report' })
  async getIntelligenceReport(@Req() req: any, @Query('period') period: string) {
    const filters = { period, insight_type: 'intelligence_report', page: 1, per_page: 1 };
    const result = await this.aiService.getInsights(req.user.company_id, filters);
    return result.items[0] || null;
  }
}
