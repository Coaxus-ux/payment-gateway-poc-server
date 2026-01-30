import { Transaction } from './transaction';

describe('Transaction items', () => {
  it('rejects empty items', () => {
    const result = Transaction.create({
      id: 'tx-1',
      customerId: 'cust-1',
      deliveryId: 'del-1',
      amount: 1000,
      currency: 'COP',
      items: [],
    });

    expect(result.ok).toBe(false);
  });

  it('rejects item with invalid quantity', () => {
    const result = Transaction.create({
      id: 'tx-1',
      customerId: 'cust-1',
      deliveryId: 'del-1',
      amount: 1000,
      currency: 'COP',
      items: [
        {
          productId: 'prod-1',
          quantity: 0,
          productSnapshot: {
            id: 'prod-1',
            name: 'Test',
            description: null,
            imageUrls: [],
            priceAmount: 1000,
            currency: 'COP',
          },
        },
      ],
    });

    expect(result.ok).toBe(false);
  });
});
