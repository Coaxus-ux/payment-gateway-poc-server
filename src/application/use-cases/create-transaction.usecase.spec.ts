import { CreateTransactionUseCase } from './create-transaction.usecase';
import { Product } from '@/domain/product/product';
import { Stock } from '@/domain/product/stock';
import { Result } from '@/shared/result';

describe('CreateTransactionUseCase', () => {
  const makeProduct = ({
    id,
    priceAmount = 1000,
    currency = 'COP',
    stockUnits = 5,
  }: {
    id: string;
    priceAmount?: number;
    currency?: string;
    stockUnits?: number;
  }) => {
    const stock = Stock.create(stockUnits);
    if (!stock.ok) {
      throw new Error('invalid stock');
    }
    const product = Product.create({
      id,
      name: 'Product',
      description: null,
      priceAmount,
      currency,
      stock: stock.value,
    });
    if (!product.ok) {
      throw new Error('invalid product');
    }
    return product.value;
  };

  it('rejects when amount mismatches', async () => {
    const product = makeProduct({ id: 'prod-1', priceAmount: 1000 });
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(product),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 2000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('AMOUNT_MISMATCH');
    }
  });

  it('rejects when items are missing', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(null),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      amount: 1000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('ITEMS_INVALID');
    }
  });

  it('creates transaction when valid with multiple items', async () => {
    const productA = makeProduct({ id: 'prod-1', priceAmount: 1000 });
    const productB = makeProduct({ id: 'prod-2', priceAmount: 500 });
    let capturedItems: Array<{ productId: string; quantity: number }> = [];
    const useCase = new CreateTransactionUseCase(
      {
        findById: (id: string) =>
          Promise.resolve(id === 'prod-1' ? productA : productB),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: ({ transaction }) => {
          capturedItems = transaction.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }));
          return Promise.resolve(Result.ok(transaction).value);
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 3 },
      ],
      amount: 1000 * 2 + 500 * 3,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(true);
    expect(capturedItems).toEqual([
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 3 },
    ]);
  });

  it('rejects when product is missing', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(null),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [{ productId: 'prod-404', quantity: 1 }],
      amount: 1000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('PRODUCT_NOT_FOUND');
    }
  });

  it('rejects when out of stock', async () => {
    const product = makeProduct({ id: 'prod-1', stockUnits: 0 });
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(product),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 1000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('OUT_OF_STOCK');
    }
  });

  it('rejects when currency mismatches across items', async () => {
    const product = makeProduct({
      id: 'prod-1',
      priceAmount: 1000,
      currency: 'USD',
    });
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(product),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 1000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('AMOUNT_MISMATCH');
    }
  });

  it('aggregates duplicate items when calculating total', async () => {
    const product = makeProduct({
      id: 'prod-1',
      priceAmount: 1000,
      stockUnits: 5,
    });
    let capturedQuantity = 0;
    const useCase = new CreateTransactionUseCase(
      {
        findById: () => Promise.resolve(product),
        findAll: () => Promise.resolve([]),
      },
      {
        createPendingTransaction: ({ transaction }) => {
          capturedQuantity = transaction.items[0]?.quantity ?? 0;
          return Promise.resolve(Result.ok(transaction).value);
        },
        updateDeliveryIfPending: () => Promise.resolve(null),
      },
    );

    const result = await useCase.execute({
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-1', quantity: 1 },
      ],
      amount: 3000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(true);
    expect(capturedQuantity).toBe(3);
  });
});
