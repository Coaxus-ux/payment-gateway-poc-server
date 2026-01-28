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

  @Column({
    name: 'provider_ref',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  providerRef!: string | null;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  failureReason!: string | null;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName!: string;

  @Column({ name: 'product_description', type: 'text', nullable: true })
  productDescription!: string | null;

  @Column({ name: 'product_image_urls', type: 'jsonb', nullable: true })
  productImageUrls!: string[] | null;

  @Column({ name: 'product_price_amount', type: 'integer' })
  productPriceAmount!: number;

  @Column({ name: 'product_currency', type: 'varchar', length: 10 })
  productCurrency!: string;

  @VersionColumn()
  version!: number;
}
