import { CreateTransactionUseCase } from './create-transaction.usecase';
import { Product } from '@/domain/product/product';
import { Stock } from '@/domain/product/stock';
import { Result } from '@/shared/result';

describe('CreateTransactionUseCase', () => {
  const makeProduct = (stockUnits = 5) => {
    const stock = Stock.create(stockUnits);
    if (!stock.ok) {
      throw new Error('invalid stock');
    }
    const product = Product.create({
      id: 'prod-1',
      name: 'Product',
      description: null,
      priceAmount: 1000,
      currency: 'COP',
      stock: stock.value,
    });
    if (!product.ok) {
      throw new Error('invalid product');
    }
    return product.value;
  };

  it('rejects when amount mismatches', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: async () => makeProduct(5),
        findAll: async () => [],
      },
      {
        createPendingTransaction: async () => {
          throw new Error('should not be called');
        },
        updateDeliveryIfPending: async () => null,
      },
    );

    const result = await useCase.execute({
      productId: 'prod-1',
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

  it('creates transaction when valid', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: async () => makeProduct(5),
        findAll: async () => [],
      },
      {
        createPendingTransaction: async ({ transaction }) =>
          Result.ok(transaction).value,
        updateDeliveryIfPending: async () => null,
      },
    );

    const result = await useCase.execute({
      productId: 'prod-1',
      amount: 1000,
      currency: 'COP',
      customer: { email: 'a@b.com', fullName: 'Test' },
      delivery: { addressLine1: 'Street', city: 'City', country: 'CO' },
    });

    expect(result.ok).toBe(true);
  });
});
