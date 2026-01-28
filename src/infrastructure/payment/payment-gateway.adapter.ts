/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  PaymentProvider,
  PaymentResult,
} from '@/application/ports/payment-provider';

type AcceptanceTokens = {
  acceptanceToken: string;
  acceptPersonalAuth: string;
};

@Injectable()
export class PaymentGatewayProvider implements PaymentProvider {
  private readonly http: AxiosInstance;
  private cachedTokens: { tokens: AcceptanceTokens; fetchedAt: number } | null =
    null;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.PAYMENT_BASE_URL,
      timeout: 15000,
    });
  }

  private async getAcceptanceTokens(): Promise<AcceptanceTokens> {
    if (
      this.cachedTokens &&
      Date.now() - this.cachedTokens.fetchedAt < 600000
    ) {
      return this.cachedTokens.tokens;
    }
    const publicKey = process.env.PAYMENT_PUBLIC_KEY ?? '';
    const response = await this.http.get(`/v1/merchants/${publicKey}`);
    const presigned = response.data?.data?.presigned_acceptance;
    const personal = response.data?.data?.presigned_personal_data_auth;
    const tokens = {
      acceptanceToken: presigned?.acceptance_token as string,
      acceptPersonalAuth: personal?.acceptance_token as string,
    };
    if (!tokens.acceptanceToken || !tokens.acceptPersonalAuth) {
      throw new Error('Missing payment acceptance tokens');
    }
    this.cachedTokens = { tokens, fetchedAt: Date.now() };
    return tokens;
  }

  async charge(input: {
    amount: number;
    currency: string;
    card: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
      holderName?: string;
    };
    customerEmail: string;
    reference: string;
  }): Promise<PaymentResult> {
    const tokens = await this.getAcceptanceTokens();
    const publicKey = process.env.PAYMENT_PUBLIC_KEY ?? '';
    const privateKey = process.env.PAYMENT_PRIVATE_KEY ?? '';

    const cardTokenRes = await this.http.post(
      '/v1/tokens/cards',
      {
        number: input.card.number,
        exp_month: String(input.card.expMonth).padStart(2, '0'),
        exp_year: String(input.card.expYear).slice(-2),
        cvc: input.card.cvc,
        card_holder: input.card.holderName ?? 'Card Holder',
      },
      {
        headers: {
          Authorization: `Bearer ${publicKey}`,
        },
      },
    );

    const cardToken: string | undefined = cardTokenRes.data?.data?.id;
    if (!cardToken) {
      return {
        status: 'FAILED',
        providerRef: '',
        failureReason: 'TOKENIZATION_FAILED',
      };
    }

    const paymentSourceRes = await this.http.post(
      '/v1/payment_sources',
      {
        type: 'CARD',
        token: cardToken,
        customer_email: input.customerEmail,
        acceptance_token: tokens.acceptanceToken,
        accept_personal_auth: tokens.acceptPersonalAuth,
      },
      {
        headers: {
          Authorization: `Bearer ${privateKey}`,
        },
      },
    );

    const paymentSourceId: number | undefined = paymentSourceRes.data?.data?.id;
    if (!paymentSourceId) {
      return {
        status: 'FAILED',
        providerRef: '',
        failureReason: 'PAYMENT_SOURCE_FAILED',
      };
    }

    const transactionRes = await this.http.post(
      '/v1/transactions',
      {
        amount_in_cents: input.amount,
        currency: input.currency,
        customer_email: input.customerEmail,
        reference: input.reference,
        payment_source_id: paymentSourceId,
        payment_method: {
          installments: 1,
        },
        acceptance_token: tokens.acceptanceToken,
        accept_personal_auth: tokens.acceptPersonalAuth,
      },
      {
        headers: {
          Authorization: `Bearer ${privateKey}`,
        },
      },
    );

    const status: string | undefined = transactionRes.data?.data?.status;
    const providerRef: string = (transactionRes.data?.data?.id as string) ?? '';
    if (status === 'APPROVED') {
      return { status: 'SUCCESS', providerRef };
    }
    return {
      status: 'FAILED',
      providerRef,
      failureReason:
        (transactionRes.data?.data?.status_message as string) ??
        'PAYMENT_FAILED',
    };
  }
}
