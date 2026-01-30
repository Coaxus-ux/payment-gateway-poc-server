import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { TransactionEntity } from './transaction.entity';

@Entity({ name: 'transaction_items' })
export class TransactionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TransactionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: TransactionEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'unit_price_amount', type: 'integer' })
  unitPriceAmount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ name: 'product_snapshot', type: 'jsonb' })
  productSnapshot!: {
    id: string;
    name: string;
    description: string | null;
    imageUrls: string[];
    priceAmount: number;
    currency: string;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
