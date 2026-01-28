export type PaymentResult = {
  status: 'SUCCESS' | 'FAILED';
  providerRef: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  charge(input: {
    amount: number;
    currency: string;
    cardToken: string;
    customerEmail: string;
    reference: string;
  }): Promise<PaymentResult>;
}
