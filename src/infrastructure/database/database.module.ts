import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRepositoryTypeOrm } from './repositories/customer.repository';
import { DeliveryRepositoryTypeOrm } from './repositories/delivery.repository';
import { ProductRepositoryTypeOrm } from './repositories/product.repository';
import { TransactionRepositoryTypeOrm } from './repositories/transaction.repository';
import { CustomerEntity } from './entities/customer.entity';
import { DeliveryEntity } from './entities/delivery.entity';
import { ProductEntity } from './entities/product.entity';
import { TransactionEntity } from './entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      CustomerEntity,
      DeliveryEntity,
      TransactionEntity,
    ]),
  ],
  providers: [
    ProductRepositoryTypeOrm,
    CustomerRepositoryTypeOrm,
    DeliveryRepositoryTypeOrm,
    TransactionRepositoryTypeOrm,
  ],
  exports: [
    ProductRepositoryTypeOrm,
    CustomerRepositoryTypeOrm,
    DeliveryRepositoryTypeOrm,
    TransactionRepositoryTypeOrm,
  ],
})
export class DatabaseModule {}
