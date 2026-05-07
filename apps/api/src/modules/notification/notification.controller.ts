import { Controller, Post, Body, UseGuards, ConsoleLogger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from '../settings/settings.service';
import { MailProviderFactory } from './providers/mail-provider.factory';

@ApiTags('Admin Notifications')
@Controller('admin/notification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly providerFactory: MailProviderFactory,
  ) {}

  @Post('test-pipeline')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Directly test the mail pipeline (bypassing queue)' })
  async testPipeline(@Body() dto: { to: string }) {
    console.log('[TestPipeline] Starting direct mail test...');
    
    // 1. Read settings
    const settings = await this.settingsService.getSettings();
    console.log('[TestPipeline] Current Provider:', settings?.mail_provider);
    
    const mailConfig = await this.settingsService.getDecryptedMailConfig();
    if (mailConfig && mailConfig.config) {
        console.log('[TestPipeline] Config keys present:', Object.keys(mailConfig.config));
    }

    // 2. Get provider directly
    const provider = await this.providerFactory.getProvider();
    console.log('[TestPipeline] Using provider implementation:', provider.constructor.name);

    // 3. Send
    const fromAddr = settings?.mail_from_address || 'no-reply@mg.wellbeingmetric.com';
    const fromName = settings?.mail_from_name || 'Wellbeing Metric Test';

    try {
      await provider.send({
        to: dto.to,
        subject: '🚀 Wellbeing Metric Mail Pipeline Test',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #2E865A;">Bağlantı Başarılı!</h2>
            <p>Bu mail, <b>Wellbeing Metric</b> mail hattı (pipeline) testi için doğrudan gönderilmiştir.</p>
            <p>Eğer bu maili alıyorsanız, provider ayarlarınız ve render mekanizmanız doğru çalışıyor demektir.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Tarih: ${new Date().toLocaleString('tr-TR')}</p>
          </div>
        `,
        from: fromAddr,
        from_name: fromName
      });

      console.log('[TestPipeline] Direct mail sent successfully to:', dto.to);
      return { 
        success: true, 
        provider: settings?.mail_provider,
        provider_impl: provider.constructor.name
      };
    } catch (error) {
      console.error('[TestPipeline] DIRECT TEST FAILED:', error.message);
      return {
        success: false,
        error: error.message,
        provider: settings?.mail_provider
      };
    }
  }
}
