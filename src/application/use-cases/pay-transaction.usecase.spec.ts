import { PayTransactionUseCase } from './pay-transaction.usecase';
import { Transaction } from '@/domain/transaction/transaction';
import { TransactionStatus } from '@/domain/transaction/transaction-status';

describe('PayTransactionUseCase', () => {
  const baseTx = () => {
    const tx = Transaction.create({
      id: 'tx-1',
      productId: 'prod-1',
      customerId: 'cust-1',
      deliveryId: 'del-1',
      amount: 1000,
      currency: 'COP',
      productSnapshot: {
        id: 'prod-1',
        name: 'Test',
        description: null,
        priceAmount: 1000,
        currency: 'COP',
      },
    });
    if (!tx.ok) {
      throw new Error('invalid transaction');
    }
    return tx.value;
  };

  it('returns existing transaction if already final', async () => {
    const existing = Transaction.restore({
      ...baseTx(),
      status: TransactionStatus.SUCCESS,
      providerRef: 'ref',
      failureReason: null,
    });

    const useCase = new PayTransactionUseCase(
      {
        findById: async () => existing,
        create: async () => existing,
        markFailedIfPending: async () => existing,
        markSuccessAndDecrementStock: async () => ({
          transaction: existing,
          stockAdjusted: false,
          outcome: 'ALREADY_FINAL',
        }),
      },
      {
        findById: async () => null,
        findByEmail: async () => null,
        create: async () => existing as any,
      },
      {
        charge: async () => ({
          status: 'SUCCESS',
          providerRef: 'ref',
        }),
      },
    );

    const result = await useCase.execute({
      transactionId: 'tx-1',
      card: {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2030,
        cvc: '123',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe(TransactionStatus.SUCCESS);
    }
  });

  it('marks success when payment approves', async () => {
    const pending = baseTx();
    const successTx = Transaction.restore({
      ...pending,
      status: TransactionStatus.SUCCESS,
      providerRef: 'ref',
      failureReason: null,
    });

    const useCase = new PayTransactionUseCase(
      {
        findById: async () => pending,
        create: async () => pending,
        markFailedIfPending: async () => pending,
        markSuccessAndDecrementStock: async () => ({
          transaction: successTx,
          stockAdjusted: true,
          outcome: 'SUCCESS',
        }),
      },
      {
        findById: async () => ({
          id: 'cust-1',
          email: 'a@b.com',
          fullName: 'Name',
          phone: null,
        }),
        findByEmail: async () => null,
        create: async () => ({
          id: 'cust-1',
          email: 'a@b.com',
          fullName: 'Name',
          phone: null,
        }),
      },
      {
        charge: async () => ({
          status: 'SUCCESS',
          providerRef: 'ref',
        }),
      },
    );

    const result = await useCase.execute({
      transactionId: 'tx-1',
      card: {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2030,
        cvc: '123',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe(TransactionStatus.SUCCESS);
    }
  });
});
