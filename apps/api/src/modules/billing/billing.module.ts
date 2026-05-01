import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditType } from './entities/credit-type.entity';
import { ProductPackage } from './entities/product-package.entity';
import { Subscription } from './entities/subscription.entity';
import { CreditBalance } from './entities/credit-balance.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { Payment } from './entities/payment.entity';

import { CreditTypeService } from './services/credit-type.service';
import { PackageService } from './services/package.service';
import { CreditService } from './services/credit.service';
import { BillingService } from './services/billing.service';

import { BillingController } from './controllers/billing.controller';
import { AdminBillingController } from './controllers/admin-billing.controller';
import { WebhookController } from './controllers/webhook.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditType,
      ProductPackage,
      Subscription,
      CreditBalance,
      CreditTransaction,
      Payment,
    ]),
    SettingsModule, // For platform settings access
  ],
  controllers: [BillingController, AdminBillingController, WebhookController],
  providers: [
    CreditTypeService,
    PackageService,
    CreditService,
    BillingService,
  ],
  exports: [CreditTypeService, PackageService, CreditService, BillingService],
})
export class BillingModule {}
