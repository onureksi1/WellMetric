export interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string, metadata: any): Promise<any>;
  verifyWebhook(payload: any, signature: string): Promise<any>;
  cancelSubscription(subscriptionId: string): Promise<any>;
}
