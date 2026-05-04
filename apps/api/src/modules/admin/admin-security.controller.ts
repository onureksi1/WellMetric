import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { BruteForceService } from '../auth/brute-force.service';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSecurityController {
  constructor(private readonly bruteForce: BruteForceService) {}

  // Engellenmiş tüm IP/email'leri listele
  @Get('blocked')
  listBlocked() {
    return this.bruteForce.listBlocked();
  }

  // Belirli email'in engelini kaldır
  @Delete('blocked/email/:email')
  resetEmail(@Param('email') email: string) {
    return this.bruteForce.resetForEmail(email);
  }

  // Belirli IP'nin engelini kaldır
  @Delete('blocked/ip/:ip')
  resetIp(@Param('ip') ip: string) {
    return this.bruteForce.resetForIp(ip);
  }

  // Tümünü sıfırla (sadece dev/super_admin)
  @Delete('blocked/all')
  resetAll() {
    return this.bruteForce.resetAll();
  }
}
