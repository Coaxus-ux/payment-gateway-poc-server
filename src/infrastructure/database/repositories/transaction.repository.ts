import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionRepository } from '../../../application/ports/transaction-repository';
import { Transaction } from '../../../domain/transaction/transaction';
import { TransactionStatus } from '../../../domain/transaction/transaction-status';
import { CustomerEntity } from '../entities/customer.entity';
import { DeliveryEntity } from '../entities/delivery.entity';
import { ProductEntity } from '../entities/product.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

@Injectable()
export class TransactionRepositoryTypeOrm implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['product', 'customer', 'delivery'],
    });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const entity = new TransactionEntity();
    entity.id = transaction.id;
    entity.product = { id: transaction.productId } as ProductEntity;
    entity.customer = { id: transaction.customerId } as CustomerEntity;
    entity.delivery = { id: transaction.deliveryId } as DeliveryEntity;
    entity.status = transaction.status;
    entity.providerRef = transaction.providerRef;
    entity.failureReason = transaction.failureReason;
    entity.amount = transaction.amount;
    entity.currency = transaction.currency;
    entity.quantity = 1;
    entity.productName = transaction.productSnapshot.name;
    entity.productDescription = transaction.productSnapshot.description;
    entity.productPriceAmount = transaction.productSnapshot.priceAmount;
    entity.productCurrency = transaction.productSnapshot.currency;
    const saved = await this.repo.save(entity);
    const loaded = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['product', 'customer', 'delivery'],
    });
    if (!loaded) {
      throw new Error('Transaction not found after save');
    }
    return TransactionMapper.toDomain(loaded);
  }

  async markFailedIfPending(input: {
    id: string;
    reason: string;
    providerRef: string | null;
  }): Promise<Transaction | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TransactionEntity);
      const entity = await repo.findOne({
        where: { id: input.id },
        relations: ['product', 'customer', 'delivery'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!entity) {
        return null;
      }
      if (entity.status !== TransactionStatus.PENDING) {
        return TransactionMapper.toDomain(entity);
      }
      entity.status = TransactionStatus.FAILED;
      entity.failureReason = input.reason;
      entity.providerRef = input.providerRef;
      const saved = await repo.save(entity);
      return TransactionMapper.toDomain(saved);
    });
  }

  async markSuccessAndDecrementStock(input: {
    id: string;
    providerRef: string;
    quantity: number;
  }): Promise<{
    transaction: Transaction | null;
    stockAdjusted: boolean;
    outcome: 'SUCCESS' | 'ALREADY_FINAL' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND';
  }> {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(TransactionEntity);
      const productRepo = manager.getRepository(ProductEntity);

      const entity = await txRepo.findOne({
        where: { id: input.id },
        relations: ['product', 'customer', 'delivery'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!entity) {
        return {
          transaction: null,
          stockAdjusted: false,
          outcome: 'NOT_FOUND',
        };
      }

      if (entity.status !== TransactionStatus.PENDING) {
        return {
          transaction: TransactionMapper.toDomain(entity),
          stockAdjusted: false,
          outcome: 'ALREADY_FINAL',
        };
      }

      const product = await productRepo.findOne({
        where: { id: entity.product.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product || product.stockUnits < input.quantity) {
        return {
          transaction: TransactionMapper.toDomain(entity),
          stockAdjusted: false,
          outcome: 'INSUFFICIENT_STOCK',
        };
      }

      product.stockUnits -= input.quantity;
      entity.status = TransactionStatus.SUCCESS;
      entity.providerRef = input.providerRef;
      entity.failureReason = null;
      await productRepo.save(product);
      const saved = await txRepo.save(entity);

      return {
        transaction: TransactionMapper.toDomain(saved),
        stockAdjusted: true,
        outcome: 'SUCCESS',
      };
    });
  }
}
