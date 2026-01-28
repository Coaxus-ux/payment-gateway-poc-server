import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CheckoutRepository } from '@/application/ports/checkout-repository';
import { Customer } from '@/domain/customer/customer';
import { Delivery } from '@/domain/delivery/delivery';
import { Transaction } from '@/domain/transaction/transaction';
import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { CustomerEntity } from '@/infrastructure/database/entities/customer.entity';
import { DeliveryEntity } from '@/infrastructure/database/entities/delivery.entity';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';
import { CustomerMapper } from '@/infrastructure/database/mappers/customer.mapper';
import { DeliveryMapper } from '@/infrastructure/database/mappers/delivery.mapper';
import { TransactionMapper } from '@/infrastructure/database/mappers/transaction.mapper';

@Injectable()
export class CheckoutRepositoryTypeOrm implements CheckoutRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createPendingTransaction(input: {
    customer: Customer;
    delivery: Delivery;
    transaction: Transaction;
  }): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const customerRepo = manager.getRepository(CustomerEntity);
      const deliveryRepo = manager.getRepository(DeliveryEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      let customer = await customerRepo.findOne({
        where: { email: input.customer.email },
      });
      if (!customer) {
        customer = customerRepo.create(CustomerMapper.toEntity(input.customer));
        customer = await customerRepo.save(customer);
      }

      const delivery = deliveryRepo.create(
        DeliveryMapper.toEntity(input.delivery),
      );
      const savedDelivery = await deliveryRepo.save(delivery);

      const tx = new TransactionEntity();
      tx.id = input.transaction.id;
      tx.product = { id: input.transaction.productId } as ProductEntity;
      tx.customer = customer;
      tx.delivery = savedDelivery;
      tx.status = TransactionStatus.PENDING;
      tx.amount = input.transaction.amount;
      tx.currency = input.transaction.currency;
      tx.quantity = 1;
      tx.productName = input.transaction.productSnapshot.name;
      tx.productDescription = input.transaction.productSnapshot.description;
      tx.productImageUrls = input.transaction.productSnapshot.imageUrls;
      tx.productPriceAmount = input.transaction.productSnapshot.priceAmount;
      tx.productCurrency = input.transaction.productSnapshot.currency;

      const savedTx = await transactionRepo.save(tx);
      const loaded = await transactionRepo.findOne({
        where: { id: savedTx.id },
        relations: ['product', 'customer', 'delivery'],
      });
      if (!loaded) {
        throw new Error('Transaction not found after save');
      }
      return TransactionMapper.toDomain(loaded);
    });
  }

  async updateDeliveryIfPending(input: {
    deliveryId: string;
    transactionId: string;
    delivery: Delivery;
  }): Promise<Delivery | null> {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(TransactionEntity);
      const deliveryRepo = manager.getRepository(DeliveryEntity);
      const transaction = await txRepo.findOne({
        where: { id: input.transactionId },
        relations: ['delivery'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        return null;
      }
      if (transaction.status !== TransactionStatus.PENDING) {
        return null;
      }
      const delivery = deliveryRepo.create(
        DeliveryMapper.toEntity(input.delivery),
      );
      delivery.id = input.deliveryId;
      const saved = await deliveryRepo.save(delivery);
      return DeliveryMapper.toDomain(saved);
    });
  }
}
