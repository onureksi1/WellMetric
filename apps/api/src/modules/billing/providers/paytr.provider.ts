import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class PaytrProvider {
  private readonly merchantId:   string;
  private readonly merchantKey:  string;
  private readonly merchantSalt: string;
  private readonly successUrl:   string;
  private readonly failUrl:      string;

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.merchantId   = this.configService.get('PAYTR_MERCHANT_ID');
    this.merchantKey  = this.configService.get('PAYTR_MERCHANT_KEY');
    this.merchantSalt = this.configService.get('PAYTR_MERCHANT_SALT');
    this.successUrl   = this.configService.get('PAYTR_SUCCESS_URL');
    this.failUrl      = this.configService.get('PAYTR_FAIL_URL');
  }

  // ── iframe token üret (frontend iframe'de açar) ─────────────────
  async createIframeToken(params: {
    merchantOid:  string;
    email:        string;
    paymentAmount: number; // kuruş cinsinden
    basketItems:  Array<{ name: string; price: string; count: number }>;
    userIp:       string;
    userName:     string;
    userAddress:  string;
    userPhone:    string;
    installment?: number;
    currency?:    string;
  }): Promise<{ iframeToken: string }> {
    this.logger.debug('[PayTR] iframe token isteği', { service: 'PaytrProvider' }, {
      merchantOid:   params.merchantOid,
      email:         params.email,
      paymentAmount: params.paymentAmount,
    });

    const basketJson = JSON.stringify(
      params.basketItems.map(i => [i.name, i.price, i.count])
    );
    const basketEncoded = Buffer.from(basketJson).toString('base64');

    const noInstallment = 1;
    const maxInstallment = params.installment ?? 0;
    const currency = params.currency ?? 'TL';
    const testMode = this.configService.get('NODE_ENV') !== 'production' ? '1' : '0';

    // Hash hesaplama
    const hashStr = [
      this.merchantId,
      params.userIp,
      params.merchantOid,
      params.email,
      params.paymentAmount,
      basketEncoded,
      noInstallment,
      maxInstallment,
      currency,
      testMode,
    ].join('');

    const token = crypto
      .createHmac('sha256', this.merchantKey + this.merchantSalt)
      .update(hashStr)
      .digest('base64');

    const formData = new URLSearchParams({
      merchant_id:      this.merchantId,
      user_ip:          params.userIp,
      merchant_oid:     params.merchantOid,
      email:            params.email,
      payment_amount:   String(params.paymentAmount),
      paytr_token:      token,
      user_basket:      basketEncoded,
      no_installment:   String(noInstallment),
      max_installment:  String(maxInstallment),
      currency_type:    currency,
      test_mode:        testMode,
      user_name:        params.userName,
      user_address:     params.userAddress,
      user_phone:       params.userPhone,
      merchant_ok_url:  this.successUrl,
      merchant_fail_url: this.failUrl,
      debug_on:         testMode,
      lang:             'tr',
    });

    try {
      const response = await axios.post(
        'https://www.paytr.com/odeme/api/get-token',
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.status !== 'success') {
        this.logger.warn('[PayTR] token hatası', { service: 'PaytrProvider' }, {
          status: response.data.status,
          reason: response.data.reason,
        });
        throw new BadRequestException(
          `PayTR token hatası: ${response.data.reason ?? 'Bilinmeyen hata'}`
        );
      }

      this.logger.info('[PayTR] iframe token alındı', { service: 'PaytrProvider' }, {
        merchantOid: params.merchantOid,
        tokenLength: response.data.token?.length,
      });

      return { iframeToken: response.data.token };
    } catch (err) {
      this.logger.error('[PayTR] HTTP isteği başarısız', { service: 'PaytrProvider' }, err);
      throw err;
    }
  }

  // ── Webhook imza doğrulama ──────────────────────────────────────
  verifyWebhook(params: {
    merchantOid:   string;
    status:        string;
    totalAmount:   string;
    hash:          string;
  }): boolean {
    const hashStr = params.merchantOid
      + this.merchantSalt
      + params.status
      + params.totalAmount;

    const expected = crypto
      .createHmac('sha256', this.merchantKey + this.merchantSalt)
      .update(hashStr)
      .digest('base64');

    return expected === params.hash;
  }
}
