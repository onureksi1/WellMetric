import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { WhiteLabelGuard } from '../../common/guards/white-label.guard';
import { WhiteLabelService } from './white-label.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantPlan } from '../consultant/entities/consultant-plan.entity';

@Controller()
export class WhiteLabelController {
  constructor(
    private readonly wlService: WhiteLabelService,
    @InjectRepository(ConsultantPlan)
    private readonly planRepo: Repository<ConsultantPlan>,
  ) {}

  @Get('consultant/white-label')
  @UseGuards(JwtAuthGuard, ConsultantGuard)
  async getConfig(@CurrentUser() user: any) {
    const config = await this.wlService.getConfig(user.id);
    return { data: config };
  }

  @Put('consultant/white-label/branding')
  @UseGuards(JwtAuthGuard, ConsultantGuard, WhiteLabelGuard)
  updateBranding(
    @Body() dto: UpdateBrandingDto,
    @CurrentUser() user: any,
  ) {
    return this.wlService.updateBranding(user.id, dto);
  }

  @Post('consultant/white-label/logo')
  @UseGuards(JwtAuthGuard, ConsultantGuard, WhiteLabelGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('Dosya seçilmedi.');
    return this.wlService.uploadLogo(user.id, file, 'logo');
  }

  @Post('consultant/white-label/favicon')
  @UseGuards(JwtAuthGuard, ConsultantGuard, WhiteLabelGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadFavicon(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('Dosya seçilmedi.');
    return this.wlService.uploadLogo(user.id, file, 'favicon');
  }

  @Post('consultant/white-label/domain')
  @UseGuards(JwtAuthGuard, ConsultantGuard, WhiteLabelGuard)
  async setDomain(
    @Body('domain') domain: string,
    @CurrentUser() user: any,
  ) {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      throw new BadRequestException('Geçersiz domain formatı.');
    }

    const plan = await this.planRepo.findOne({
      where: { consultant_id: user.id },
    });

    if (!plan) throw new BadRequestException('Plan bulunamadı.');

    const verifyToken = `wellbeing-verify=${plan.id.slice(0, 8)}`;

    await this.planRepo.update(
      { consultant_id: user.id },
      { customDomain: domain, customDomainVerified: false },
    );

    return {
      domain,
      verified: false,
      instructions: {
        step1: `DNS yöneticinizde şu TXT kaydını ekleyin:`,
        record_type: 'TXT',
        record_name: '@',
        record_value: verifyToken,
        step2: `Kaydı ekledikten sonra doğrulama isteği gönderin.`,
        step3: `DNS yayılımı 24-48 saat sürebilir.`,
      },
    };
  }

  @Post('consultant/white-label/domain/verify')
  @UseGuards(JwtAuthGuard, ConsultantGuard, WhiteLabelGuard)
  async verifyDomain(@CurrentUser() user: any) {
    const plan = await this.planRepo.findOne({
      where: { consultant_id: user.id },
    });
    if (!plan?.customDomain) {
      throw new BadRequestException('Önce domain ekleyin.');
    }
    const verified = await this.wlService.verifyCustomDomain(
      user.id,
      plan.customDomain,
    );
    return { verified, domain: plan.customDomain };
  }

  @Get('public/white-label/:domain')
  async getConfigByDomain(@Param('domain') domain: string) {
    const consultantId = await this.wlService.getConsultantByDomain(domain);
    if (!consultantId) return null;
    return this.wlService.getConfig(consultantId);
  }
}
