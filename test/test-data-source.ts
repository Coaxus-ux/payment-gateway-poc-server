import { DataSource } from 'typeorm';
import { CustomerEntity } from '@/infrastructure/database/entities/customer.entity';
import { DeliveryEntity } from '@/infrastructure/database/entities/delivery.entity';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';
import { TransactionEntity } from '@/infrastructure/database/entities/transaction.entity';

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5433),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'checkout_test',
  entities: [ProductEntity, CustomerEntity, DeliveryEntity, TransactionEntity],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  logging: false,
});
