import { Transaction } from '@/domain/transaction/transaction';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';

export const TransactionMapper = {
  toDomain(entity: TransactionEntity): Transaction {
    return Transaction.restore({
      id: entity.id,
      productId: entity.product.id,
      customerId: entity.customer.id,
      deliveryId: entity.delivery.id,
      amount: entity.amount,
      currency: entity.currency,
      productSnapshot: {
        id: entity.product.id,
        name: entity.productName,
        description: entity.productDescription,
        imageUrl: entity.productImageUrl,
        priceAmount: entity.productPriceAmount,
        currency: entity.productCurrency,
      },
      status: entity.status,
      providerRef: entity.providerRef,
      failureReason: entity.failureReason,
    });
  },
};
