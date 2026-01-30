import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionRepository } from '@/application/ports/transaction-repository';
import { Transaction } from '@/domain/transaction/transaction';
import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { CustomerEntity } from '@/infrastructure/database/entities/customer.entity';
import { DeliveryEntity } from '@/infrastructure/database/entities/delivery.entity';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';
import { TransactionItemEntity } from '@/infrastructure/database/entities/transaction-item.entity';
import { TransactionMapper } from '@/infrastructure/database/mappers/transaction.mapper';

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
      relations: ['customer', 'delivery', 'items', 'items.product'],
    });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async listAll(input?: { limit?: number; offset?: number }) {
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;
    const [entities, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['customer', 'delivery', 'items', 'items.product'],
    });

    return {
      total,
      items: entities.map((entity) => ({
        id: entity.id,
        status: entity.status,
        amount: entity.amount,
        currency: entity.currency,
        createdAt: entity.createdAt,
        customer: {
          id: entity.customer.id,
          email: entity.customer.email,
          fullName: entity.customer.fullName,
          phone: entity.customer.phone,
        },
        delivery: {
          id: entity.delivery.id,
          addressLine1: entity.delivery.addressLine1,
          addressLine2: entity.delivery.addressLine2,
          city: entity.delivery.city,
          country: entity.delivery.country,
          postalCode: entity.delivery.postalCode,
        },
        items: (entity.items ?? []).map((item) => ({
          id: item.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPriceAmount: item.unitPriceAmount,
          currency: item.currency,
          productSnapshot: item.productSnapshot,
        })),
      })),
    };
  }

  async findLatestByCustomerId(customerId: string) {
    const entity = await this.repo.findOne({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
      relations: ['delivery'],
    });
    if (!entity) return null;
    return {
      transactionId: entity.id,
      delivery: {
        id: entity.delivery.id,
        addressLine1: entity.delivery.addressLine1,
        addressLine2: entity.delivery.addressLine2,
        city: entity.delivery.city,
        country: entity.delivery.country,
        postalCode: entity.delivery.postalCode,
      },
    };
  }

  async create(transaction: Transaction): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepo = manager.getRepository(TransactionEntity);
      const itemRepo = manager.getRepository(TransactionItemEntity);

      const entity = new TransactionEntity();
      entity.id = transaction.id;
      entity.customer = { id: transaction.customerId } as CustomerEntity;
      entity.delivery = { id: transaction.deliveryId } as DeliveryEntity;
      entity.status = transaction.status;
      entity.providerRef = transaction.providerRef;
      entity.failureReason = transaction.failureReason;
      entity.amount = transaction.amount;
      entity.currency = transaction.currency;
      entity.cardLast4 = null;

      const saved = await transactionRepo.save(entity);
      const items = transaction.items.map((item) => {
        const detail = new TransactionItemEntity();
        detail.transaction = saved;
        detail.product = { id: item.productId } as ProductEntity;
        detail.quantity = item.quantity;
        detail.unitPriceAmount = item.productSnapshot.priceAmount;
        detail.currency = item.productSnapshot.currency;
        detail.productSnapshot = item.productSnapshot;
        return detail;
      });
      await itemRepo.save(items);

      const loaded = await transactionRepo.findOne({
        where: { id: saved.id },
        relations: ['customer', 'delivery', 'items', 'items.product'],
      });
      if (!loaded) {
        throw new Error('Transaction not found after save');
      }
      return TransactionMapper.toDomain(loaded);
    });
  }

  async markFailedIfPending(input: {
    id: string;
    reason: string;
    providerRef: string | null;
    cardLast4: string | null;
  }): Promise<Transaction | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TransactionEntity);
      const entity = await repo
        .createQueryBuilder('tx')
        .innerJoinAndSelect('tx.customer', 'customer')
        .innerJoinAndSelect('tx.delivery', 'delivery')
        .where('tx.id = :id', { id: input.id })
        .setLock('pessimistic_write')
        .getOne();
      if (!entity) {
        return null;
      }
      if (entity.status !== TransactionStatus.PENDING) {
        return TransactionMapper.toDomain(entity);
      }
      entity.status = TransactionStatus.FAILED;
      entity.failureReason = input.reason;
      entity.providerRef = input.providerRef;
      entity.cardLast4 = input.cardLast4;
      const saved = await repo.save(entity);
      return TransactionMapper.toDomain(saved);
    });
  }

  async markSuccessAndDecrementStock(input: {
    id: string;
    providerRef: string;
    cardLast4: string | null;
  }): Promise<{
    transaction: Transaction | null;
    stockAdjusted: boolean;
    outcome: 'SUCCESS' | 'ALREADY_FINAL' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND';
  }> {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(TransactionEntity);
      const productRepo = manager.getRepository(ProductEntity);
      const itemRepo = manager.getRepository(TransactionItemEntity);

      const entity = await txRepo
        .createQueryBuilder('tx')
        .innerJoinAndSelect('tx.customer', 'customer')
        .innerJoinAndSelect('tx.delivery', 'delivery')
        .where('tx.id = :id', { id: input.id })
        .setLock('pessimistic_write')
        .getOne();

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

      const items = await itemRepo.find({
        where: { transaction: { id: entity.id } },
        relations: ['product'],
      });
      if (items.length === 0) {
        return {
          transaction: TransactionMapper.toDomain(entity),
          stockAdjusted: false,
          outcome: 'INSUFFICIENT_STOCK',
        };
      }

      const productMap = new Map<
        string,
        { entity: ProductEntity; quantity: number }
      >();
      for (const item of items) {
        const productId = item.product.id;
        const existing = productMap.get(productId);
        if (existing) {
          existing.quantity += item.quantity;
          continue;
        }
        const product = await productRepo.findOne({
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product || product.stockUnits < item.quantity) {
          return {
            transaction: TransactionMapper.toDomain(entity),
            stockAdjusted: false,
            outcome: 'INSUFFICIENT_STOCK',
          };
        }
        productMap.set(productId, { entity: product, quantity: item.quantity });
      }

      for (const [_, entry] of productMap) {
        if (entry.entity.stockUnits < entry.quantity) {
          return {
            transaction: TransactionMapper.toDomain(entity),
            stockAdjusted: false,
            outcome: 'INSUFFICIENT_STOCK',
          };
        }
        entry.entity.stockUnits -= entry.quantity;
        await productRepo.save(entry.entity);
      }

      entity.status = TransactionStatus.SUCCESS;
      entity.providerRef = input.providerRef;
      entity.failureReason = null;
      entity.cardLast4 = input.cardLast4;
      const saved = await txRepo.save(entity);

      return {
        transaction: TransactionMapper.toDomain(saved),
        stockAdjusted: true,
        outcome: 'SUCCESS',
      };
    });
  }
}
