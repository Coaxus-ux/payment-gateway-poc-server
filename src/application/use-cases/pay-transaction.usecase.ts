import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction/transaction';
import { TransactionStatus } from '../../domain/transaction/transaction-status';
import { Result } from '../../shared/result';
import { ApplicationError } from '../errors';
import { CustomerRepository } from '../ports/customer-repository';
import { PaymentProvider } from '../ports/payment-provider';
import { TransactionRepository } from '../ports/transaction-repository';
import {
  CUSTOMER_REPOSITORY,
  PAYMENT_PROVIDER,
  TRANSACTION_REPOSITORY,
} from '../tokens';

export type PayTransactionInput = {
  transactionId: string;
  card: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
    holderName?: string;
  };
};

@Injectable()
export class PayTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(input: PayTransactionInput) {
    const transaction = await this.transactionRepository.findById(
      input.transactionId,
    );
    if (!transaction) {
      return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      return Result.ok<Transaction>(transaction);
    }

    const customer = await this.customerRepository.findById(
      transaction.customerId,
    );
    if (!customer) {
      return Result.err<ApplicationError>({ type: 'CUSTOMER_NOT_FOUND' });
    }

    const payment = await this.paymentProvider.charge({
      amount: transaction.amount,
      currency: transaction.currency,
      card: input.card,
      customerEmail: customer.email,
      reference: transaction.id,
    });

    if (payment.status === 'FAILED') {
      const updated = await this.transactionRepository.markFailedIfPending({
        id: transaction.id,
        reason: payment.failureReason ?? 'PAYMENT_FAILED',
        providerRef: payment.providerRef ?? null,
      });
      if (!updated) {
        return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
      }
      return Result.err<ApplicationError>({
        type: 'PAYMENT_FAILED',
        reason: payment.failureReason ?? 'PAYMENT_FAILED',
      });
    }

    const success = await this.transactionRepository.markSuccessAndDecrementStock(
      {
        id: transaction.id,
        providerRef: payment.providerRef,
        quantity: 1,
      },
    );

    if (success.outcome === 'NOT_FOUND') {
      return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
    }
    if (success.outcome === 'INSUFFICIENT_STOCK') {
      return Result.err<ApplicationError>({ type: 'OUT_OF_STOCK' });
    }
    if (success.transaction) {
      return Result.ok<Transaction>(success.transaction);
    }

    return Result.err<ApplicationError>({ type: 'TRANSACTION_NOT_FOUND' });
  }
}
