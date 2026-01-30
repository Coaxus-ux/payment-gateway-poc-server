import { PayTransactionUseCase } from './pay-transaction.usecase';
import { Transaction } from '@/domain/transaction/transaction';
import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { Customer } from '@/domain/customer/customer';

describe('PayTransactionUseCase', () => {
  const baseTx = () => {
    const tx = Transaction.create({
      id: 'tx-1',
      customerId: 'cust-1',
      deliveryId: 'del-1',
      amount: 1000,
      currency: 'COP',
      items: [
        {
          productId: 'prod-1',
          quantity: 1,
          productSnapshot: {
            id: 'prod-1',
            name: 'Test',
            description: null,
            priceAmount: 1000,
            currency: 'COP',
          },
        },
      ],
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
        findById: () => Promise.resolve(existing),
        create: () => Promise.resolve(existing),
        markFailedIfPending: () => Promise.resolve(existing),
        markSuccessAndDecrementStock: () =>
          Promise.resolve({
            transaction: existing,
            stockAdjusted: false,
            outcome: 'ALREADY_FINAL' as const,
          }),
      },
      {
        findById: () => Promise.resolve(null),
        findByEmail: () => Promise.resolve(null),
        create: () => Promise.resolve(existing as unknown as Customer),
      },
      {
        charge: () =>
          Promise.resolve({
            status: 'SUCCESS' as const,
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
        findById: () => Promise.resolve(pending),
        create: () => Promise.resolve(pending),
        markFailedIfPending: () => Promise.resolve(pending),
        markSuccessAndDecrementStock: () =>
          Promise.resolve({
            transaction: successTx,
            stockAdjusted: true,
            outcome: 'SUCCESS' as const,
          }),
      },
      {
        findById: () =>
          Promise.resolve({
            id: 'cust-1',
            email: 'a@b.com',
            fullName: 'Name',
            phone: null,
          }),
        findByEmail: () => Promise.resolve(null),
        create: () =>
          Promise.resolve({
            id: 'cust-1',
            email: 'a@b.com',
            fullName: 'Name',
            phone: null,
          }),
      },
      {
        charge: () =>
          Promise.resolve({
            status: 'SUCCESS' as const,
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
