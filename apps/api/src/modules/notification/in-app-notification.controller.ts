import { 
  Controller, 
  Get, 
  Patch, 
  Post,
  Delete, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InAppNotificationService } from './in-app-notification.service';

interface JwtPayload {
  id: string;
  company_id: string;
  role: string;
  language?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class InAppNotificationController {
  constructor(
    private readonly service: InAppNotificationService
  ) {}

  // Liste
  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findByUser(user.id, 50);
  }

  // Okunmamış sayısı
  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.service.countUnread(user.id);
    return { count };
  }

  // Okundu işaretle
  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.service.markRead(id, user.id);
    return { ok: true };
  }

  // Tümünü okundu işaretle
  @Post('read-all')
  async markAllRead(@CurrentUser() user: JwtPayload) {
    await this.service.markAllRead(user.id);
    return { ok: true };
  }

  // Sil
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.service.delete(id, user.id);
    return { ok: true };
  }
}
