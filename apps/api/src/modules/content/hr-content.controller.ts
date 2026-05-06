import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HrContentService } from './hr-content.service';

@Controller('hr/content-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrContentController {
  constructor(private readonly hrContentService: HrContentService) {}

  @Get()
  @Roles('hr_admin')
  async getContentAssignments(@CurrentUser() user: any) {
    return this.hrContentService.findAssignments(user.company_id);
  }

  @Post(':id/notify')
  @Roles('hr_admin')
  async notifyEmployees(@Param('id') id: string, @CurrentUser() user: any) {
    return this.hrContentService.notifyEmployees(id, user.id, user.company_id);
  }
}
