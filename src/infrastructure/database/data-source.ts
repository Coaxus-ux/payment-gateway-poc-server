import { DataSource } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { DeliveryEntity } from './entities/delivery.entity';
import { ProductEntity } from './entities/product.entity';
import { TransactionEntity } from './entities/transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [ProductEntity, CustomerEntity, DeliveryEntity, TransactionEntity],
  migrations: ['dist/infrastructure/database/migrations/*.js'],
  logging: false,
});
