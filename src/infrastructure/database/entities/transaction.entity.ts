import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { TransactionStatus } from '@/domain/transaction/transaction-status';
import { CustomerEntity } from './customer.entity';
import { DeliveryEntity } from './delivery.entity';
import { TransactionItemEntity } from './transaction-item.entity';

@Entity({ name: 'transactions' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ name: 'card_last4', type: 'varchar', length: 4, nullable: true })
  cardLast4!: string | null;

  @OneToMany(() => TransactionItemEntity, (item) => item.transaction, {
    cascade: true,
  })
  items!: TransactionItemEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;
}
