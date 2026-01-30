import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { TransactionMapper } from './transaction.mapper';
import { CustomerEntity } from '@/infrastructure/database/entities/customer.entity';
import { DeliveryEntity } from '@/infrastructure/database/entities/delivery.entity';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';
import { TransactionItemEntity } from '@/infrastructure/database/entities/transaction-item.entity';

describe('TransactionMapper', () => {
  it('maps transaction items from entities', () => {
    const customer = new CustomerEntity();
    customer.id = 'cust-1';

    const delivery = new DeliveryEntity();
    delivery.id = 'del-1';

    const product = new ProductEntity();
    product.id = 'prod-1';

    const item = new TransactionItemEntity();
    item.id = 'item-1';
    item.product = product;
    item.quantity = 2;
    item.unitPriceAmount = 1500;
    item.currency = 'COP';
    item.productSnapshot = {
      id: 'prod-1',
      name: 'Product',
      description: null,
      imageUrls: [],
      priceAmount: 1500,
      currency: 'COP',
    };

    const entity = new TransactionEntity();
    entity.id = 'tx-1';
    entity.customer = customer;
    entity.delivery = delivery;
    entity.status = TransactionStatus.PENDING;
    entity.providerRef = null;
    entity.failureReason = null;
    entity.amount = 3000;
    entity.currency = 'COP';
    entity.items = [item];

    const mapped = TransactionMapper.toDomain(entity);

    expect(mapped.items).toHaveLength(1);
    expect(mapped.items[0].productId).toBe('prod-1');
    expect(mapped.items[0].quantity).toBe(2);
    expect(mapped.items[0].productSnapshot.priceAmount).toBe(1500);
  });
});
