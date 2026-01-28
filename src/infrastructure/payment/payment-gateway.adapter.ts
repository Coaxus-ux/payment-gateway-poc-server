/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import axios, { AxiosInstance } from 'axios';
import {
  PaymentProvider,
  PaymentResult,
} from '@/application/ports/payment-provider';
import { AppLogger } from '@/shared/logging/app-logger';
import { redactSensitive } from '@/shared/logging/redact';

type AcceptanceTokens = {
  acceptanceToken: string;
  acceptPersonalAuth: string;
};

@Injectable()
export class PaymentGatewayProvider implements PaymentProvider {
  private readonly http: AxiosInstance;
  private cachedTokens: { tokens: AcceptanceTokens; fetchedAt: number } | null =
    null;
  private readonly logger = new AppLogger();

  constructor() {
    const rawBaseUrl =
      process.env.PAYMENT_BASE_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1';
    const normalizedBaseUrl = rawBaseUrl.replace(/\/v1\/?$/, '');
    this.http = axios.create({
      baseURL: normalizedBaseUrl,
      timeout: 15000,
    });

    this.http.interceptors.request.use((config) => {
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      this.logger.log(
        `[payment-gateway] request ${config.method?.toUpperCase() ?? 'GET'} ${url} ${JSON.stringify(
          redactSensitive({
            headers: config.headers ?? {},
            params: config.params ?? {},
            data: config.data ?? {},
          }),
        )}`,
      );
      return config;
    });

    this.http.interceptors.response.use(
      (response) => {
        const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
        this.logger.log(
          `[payment-gateway] response ${response.status} ${url} ${JSON.stringify(
            redactSensitive(response.data ?? {}),
          )}`,
        );
        return response;
      },
      (error) => {
        const url = `${error?.config?.baseURL ?? ''}${error?.config?.url ?? ''}`;
        this.logger.error(
          `[payment-gateway] error ${error?.response?.status ?? 'UNKNOWN'} ${url} ${JSON.stringify(
            redactSensitive({
              message: error?.message,
              data: error?.response?.data,
            }),
          )}`,
        );
        return Promise.reject(error);
      },
    );
  }

  private async getAcceptanceTokens(
    forceRefresh = false,
  ): Promise<AcceptanceTokens> {
    if (
      !forceRefresh &&
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
    const integrityKey = process.env.PAYMENT_INTEGRITY_KEY ?? '';

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

    let paymentSourceRes;
    try {
      paymentSourceRes = await this.http.post(
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
    } catch (error: any) {
      const messages = error?.response?.data?.error?.messages ?? {};
      if (messages?.acceptance_token) {
        const refreshed = await this.getAcceptanceTokens(true);
        paymentSourceRes = await this.http.post(
          '/v1/payment_sources',
          {
            type: 'CARD',
            token: cardToken,
            customer_email: input.customerEmail,
            acceptance_token: refreshed.acceptanceToken,
            accept_personal_auth: refreshed.acceptPersonalAuth,
          },
          {
            headers: {
              Authorization: `Bearer ${privateKey}`,
            },
          },
        );
      } else {
        throw error;
      }
    }

    const paymentSourceId: number | undefined = paymentSourceRes.data?.data?.id;
    if (!paymentSourceId) {
      return {
        status: 'FAILED',
        providerRef: '',
        failureReason: 'PAYMENT_SOURCE_FAILED',
      };
    }

    if (!integrityKey) {
      throw new Error('Missing payment integrity key');
    }
    const signature = createHash('sha256')
      .update(
        `${input.reference}${input.amount}${input.currency}${integrityKey}`,
      )
      .digest('hex');

    const transactionRes = await this.http.post(
      '/v1/transactions',
      {
        amount_in_cents: input.amount,
        currency: input.currency,
        signature,
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
    if (status === 'APPROVED' || status === 'PENDING') {
      return {
        status: 'SUCCESS',
        providerRef,
        metadata: { paymentStatus: status },
      };
    }
    return {
      status: 'FAILED',
      providerRef,
      failureReason:
        (transactionRes.data?.data?.status_message as string) ??
        (status as string) ??
        'PAYMENT_FAILED',
    };
  }
}
