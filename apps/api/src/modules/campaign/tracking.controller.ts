import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CampaignService } from './campaign.service';

@Controller('track')
@UseGuards(ThrottlerGuard)
export class TrackingController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('open/:logId')
  @Throttle({ tracking: { limit: 10, ttl: 60000 } })
  async trackOpen(@Param('logId') logId: string, @Res() res: Response) {
    await this.campaignService.trackOpen(logId);
    
    // 1x1 transparent gif
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64',
    );

    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    
    res.send(pixel);
  }

  @Get('click/:logId')
  @Throttle({ tracking: { limit: 10, ttl: 60000 } })
  async trackClick(@Param('logId') logId: string, @Res() res: Response) {
    const surveyUrl = await this.campaignService.trackClick(logId);
    res.redirect(302, surveyUrl);
  }
}
