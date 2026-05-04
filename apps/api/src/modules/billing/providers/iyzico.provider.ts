const Iyzipay = require('iyzipay');
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class IyzicoProvider {
  private readonly client: any;

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.client = new Iyzipay({
      apiKey:    this.configService.get('IYZICO_API_KEY'),
      secretKey: this.configService.get('IYZICO_SECRET_KEY'),
      uri:       this.configService.get('IYZICO_BASE_URL'),
    });
  }

  // ── Tek seferlik ödeme (kredi satın alma) ──────────────────────
  async createPayment(params: {
    price:          string;
    paidPrice:      string;
    currency:       string;
    installment:    number;
    paymentCard: {
      cardHolderName: string;
      cardNumber:     string;
      expireMonth:    string;
      expireYear:     string;
      cvc:            string;
    };
    buyer: {
      id:                  string;
      name:                string;
      surname:             string;
      email:               string;
      identityNumber:      string;
      registrationAddress: string;
      ip:                  string;
      city:                string;
      country:             string;
    };
    billingAddress: {
      contactName: string;
      city:        string;
      country:     string;
      address:     string;
    };
    basketItems: Array<{
      id:        string;
      name:      string;
      category1: string;
      itemType:  string;
      price:     string;
    }>;
  }): Promise<{ status: string; paymentId?: string; errorMessage?: string }> {
    this.logger.debug('[iyzico] ödeme başlatılıyor', { service: 'IyzicoProvider' }, {
      price:    params.price,
      currency: params.currency,
      buyer_id: params.buyer.id,
    });

    return new Promise((resolve, reject) => {
      this.client.payment.create({
        locale:         Iyzipay.LOCALE.TR,
        conversationId: `conv-${Date.now()}`,
        price:          params.price,
        paidPrice:      params.paidPrice,
        currency:       Iyzipay.CURRENCY.TRY,
        installment:    params.installment,
        basketId:       `basket-${Date.now()}`,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup:   Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard:    params.paymentCard,
        buyer:          params.buyer,
        shippingAddress: params.billingAddress,
        billingAddress:  params.billingAddress,
        basketItems:     params.basketItems,
      }, (err, result) => {
        if (err) {
          this.logger.error('[iyzico] SDK hatası', { service: 'IyzicoProvider' }, err);
          return reject(err);
        }
        if (result.status === 'success') {
          this.logger.info('[iyzico] ödeme başarılı', { service: 'IyzicoProvider' }, {
            paymentId: result.paymentId,
          });
          resolve({ status: 'success', paymentId: result.paymentId });
        } else {
          this.logger.warn('[iyzico] ödeme reddedildi', { service: 'IyzicoProvider' }, {
            errorCode:    result.errorCode,
            errorMessage: result.errorMessage,
            errorGroup:   result.errorGroup,
          });
          resolve({
            status: 'failed',
            errorMessage: result.errorMessage ?? 'Ödeme başarısız',
          });
        }
      });
    });
  }

  // ── Abonelik oluştur (Kart saklama) ─────────────────
  async createCardToken(params: {
    cardAlias:      string;
    cardHolderName: string;
    cardNumber:     string;
    expireMonth:    string;
    expireYear:     string;
    email:          string;
  }): Promise<{ cardToken?: string; cardUserKey?: string; error?: string }> {

    return new Promise((resolve) => {
      this.client.cardStorage.create({
        locale:         Iyzipay.LOCALE.TR,
        conversationId: `card-${Date.now()}`,
        email:          params.email,
        externalId:     params.email,
        card: {
          cardAlias:      params.cardAlias,
          cardHolderName: params.cardHolderName,
          cardNumber:     params.cardNumber,
          expireMonth:    params.expireMonth,
          expireYear:     params.expireYear,
        },
      }, (err, result) => {
        if (err || result.status !== 'success') {
          resolve({ error: result?.errorMessage ?? 'Kart kaydedilemedi' });
          return;
        }
        resolve({
          cardToken:   result.cardDetails[0].cardToken,
          cardUserKey: result.cardUserKey,
        });
      });
    });
  }

  // ── Kayıtlı kartla ödeme ────────────────────────────────────────
  async chargeStoredCard(params: {
    price:       string;
    paidPrice:   string;
    cardToken:   string;
    cardUserKey: string;
    buyer:       any;
    billingAddress: any;
    basketItems: any[];
  }): Promise<{ status: string; paymentId?: string; errorMessage?: string }> {

    return new Promise((resolve) => {
      this.client.payment.create({
        locale:         Iyzipay.LOCALE.TR,
        conversationId: `sub-${Date.now()}`,
        price:          params.price,
        paidPrice:      params.paidPrice,
        currency:       Iyzipay.CURRENCY.TRY,
        installment:    1,
        basketId:       `sub-basket-${Date.now()}`,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup:   Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
        paymentCard: {
          cardToken:   params.cardToken,
          cardUserKey: params.cardUserKey,
        },
        buyer:          params.buyer,
        shippingAddress: params.billingAddress,
        billingAddress:  params.billingAddress,
        basketItems:     params.basketItems,
      }, (err, result) => {
        if (err) return resolve({ status: 'failed', errorMessage: err.message });
        resolve(
          result.status === 'success'
            ? { status: 'success', paymentId: result.paymentId }
            : { status: 'failed', errorMessage: result.errorMessage },
        );
      });
    });
  }

  // ── İade ────────────────────────────────────────────────────────
  async refund(params: {
    paymentTransactionId: string;
    price:                string;
    currency:             string;
    ip:                   string;
  }): Promise<{ status: string; errorMessage?: string }> {

    return new Promise((resolve) => {
      this.client.refund.create({
        locale:               Iyzipay.LOCALE.TR,
        conversationId:       `refund-${Date.now()}`,
        paymentTransactionId: params.paymentTransactionId,
        price:                params.price,
        currency:             Iyzipay.CURRENCY.TRY,
        ip:                   params.ip,
      }, (err, result) => {
        if (err) return resolve({ status: 'failed', errorMessage: err.message });
        resolve(
          result.status === 'success'
            ? { status: 'success' }
            : { status: 'failed', errorMessage: result.errorMessage },
        );
      });
    });
  }
}
