import { Transaction } from './transaction';
import { TransactionStatus } from './transaction-status';

describe('Transaction', () => {
  const baseProps = {
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
  };

  it('marks success from pending', () => {
    const tx = Transaction.create(baseProps);
    expect(tx.ok).toBe(true);
    const updated = tx.ok ? tx.value.markSuccess('ref') : tx;
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.value.status).toBe(TransactionStatus.SUCCESS);
    }
  });

  it('rejects success when already final', () => {
    const restored = Transaction.restore({
      ...baseProps,
      status: TransactionStatus.SUCCESS,
      providerRef: 'ref',
      failureReason: null,
    });
    const updated = restored.markSuccess('ref-2');
    expect(updated.ok).toBe(false);
  });
});
