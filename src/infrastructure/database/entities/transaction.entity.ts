import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';
import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { CustomerEntity } from './customer.entity';
import { DeliveryEntity } from './delivery.entity';
import { ProductEntity } from './product.entity';

@Entity({ name: 'transactions' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: 'customer_id' })
  customer!: CustomerEntity;

  @OneToOne(() => DeliveryEntity)
  @JoinColumn({ name: 'delivery_id' })
  delivery!: DeliveryEntity;

  @Column({ type: 'varchar', length: 20 })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  providerRef!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  failureReason!: string | null;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'text', nullable: true })
  productDescription!: string | null;

  @Column({ type: 'integer' })
  productPriceAmount!: number;

  @Column({ type: 'varchar', length: 10 })
  productCurrency!: string;

  @VersionColumn()
  version!: number;
}
