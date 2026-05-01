import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MailTemplateService } from './mail-template.service';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TestTemplateDto } from './dto/test-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationService } from './notification.service';

@Controller('admin/mail-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class MailTemplateController {
  constructor(
    private readonly mailTemplateService: MailTemplateService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  findAll() {
    return this.mailTemplateService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.mailTemplateService.findOne(slug);
  }

  @Put(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    return this.mailTemplateService.update(slug, dto, req.user.id);
  }

  @Post(':slug/test')
  sendTest(
    @Param('slug') slug: string,
    @Body() dto: TestTemplateDto,
  ) {
    return this.mailTemplateService.sendTest(slug, dto.to, dto.language, this.notificationService);
  }

  @Post(':slug/reset')
  reset(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    return this.mailTemplateService.reset(slug, req.user.id);
  }
}
