import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/user/entities/user.entity';
import { PlatformSettings } from '../modules/settings/entities/platform-settings.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedSettings();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@wellanalytics.com';
    const adminPassword = 'Admin123!';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      this.logger.log('Seeding default Super Admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = this.userRepository.create({
        email: adminEmail,
        password_hash: hashedPassword,
        full_name: 'Sistem Yöneticisi',
        role: 'super_admin',
        company_id: null,
        is_active: true,
      });

      await this.userRepository.save(admin);
      this.logger.log('Super Admin seeded successfully.');
      this.logger.log(`Email: ${adminEmail}`);
      this.logger.log(`Password: ${adminPassword}`);
    } else {
      this.logger.log('Super Admin already exists. Skipping seed.');
    }
  }

  private async seedSettings() {
    const existing = await this.settingsRepository.find();
    if (existing.length === 0) {
      this.logger.log('Seeding default platform settings...');
      const settings = this.settingsRepository.create({
        platform_name: 'Wellbeing Metric',
        ai_enabled: true,
        ai_provider_default: 'anthropic',
        ai_model_default: 'claude-3-5-sonnet',
        anonymity_threshold: 5,
        score_alert_threshold: 45,
        supported_languages: ['tr', 'en'],
        default_language: 'tr'
      });
      await this.settingsRepository.save(settings);
    }
  }
}
