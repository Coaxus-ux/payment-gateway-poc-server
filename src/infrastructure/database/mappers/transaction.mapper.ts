import { Transaction } from '@/domain/transaction/transaction';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';

export const TransactionMapper = {
  toDomain(entity: TransactionEntity): Transaction {
    return Transaction.restore({
      id: entity.id,
      customerId: entity.customer.id,
      deliveryId: entity.delivery.id,
      amount: entity.amount,
      currency: entity.currency,
      items: (entity.items ?? []).map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        productSnapshot: item.productSnapshot,
      })),
      status: entity.status,
      providerRef: entity.providerRef,
      failureReason: entity.failureReason,
    });
  },
};
