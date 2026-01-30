import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserRepositoryTypeOrm } from './repositories/admin-user.repository';
import { CustomerRepositoryTypeOrm } from './repositories/customer.repository';
import { CheckoutRepositoryTypeOrm } from './repositories/checkout.repository';
import { DeliveryRepositoryTypeOrm } from './repositories/delivery.repository';
import { ProductRepositoryTypeOrm } from './repositories/product.repository';
import { TransactionRepositoryTypeOrm } from './repositories/transaction.repository';
import { AdminUserEntity } from './entities/admin-user.entity';
import { CustomerEntity } from './entities/customer.entity';
import { DeliveryEntity } from './entities/delivery.entity';
import { ProductEntity } from './entities/product.entity';
import { TransactionItemEntity } from './entities/transaction-item.entity';
import { TransactionEntity } from './entities/transaction.entity';
import {
  ADMIN_USER_REPOSITORY,
  CHECKOUT_REPOSITORY,
  CUSTOMER_REPOSITORY,
  DELIVERY_REPOSITORY,
  PRODUCT_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from '@/application/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      CustomerEntity,
      DeliveryEntity,
      TransactionEntity,
      TransactionItemEntity,
      AdminUserEntity,
    ]),
  ],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepositoryTypeOrm },
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerRepositoryTypeOrm },
    { provide: DELIVERY_REPOSITORY, useClass: DeliveryRepositoryTypeOrm },
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepositoryTypeOrm },
    { provide: CHECKOUT_REPOSITORY, useClass: CheckoutRepositoryTypeOrm },
    { provide: ADMIN_USER_REPOSITORY, useClass: AdminUserRepositoryTypeOrm },
  ],
  exports: [
    PRODUCT_REPOSITORY,
    CUSTOMER_REPOSITORY,
    DELIVERY_REPOSITORY,
    TRANSACTION_REPOSITORY,
    CHECKOUT_REPOSITORY,
    ADMIN_USER_REPOSITORY,
  ],
})
export class DatabaseModule {}
