import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

interface JwtPayload {
  id: string;
  company_id: string;
  role: string;
  language?: string;
}

@Controller()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('hr/onboarding/employees')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getEmployees(@CurrentUser() user: JwtPayload) {
    const data = await this.onboardingService.getEmployeeStatuses(user.company_id);
    return { data };
  }

  @Get('hr/onboarding/results/:waveNumber')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getWaveResults(
    @Param('waveNumber') waveNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.onboardingService.getAggregateResults(
      user.company_id,
      parseInt(waveNumber),
    );
    return { data };
  }
}
