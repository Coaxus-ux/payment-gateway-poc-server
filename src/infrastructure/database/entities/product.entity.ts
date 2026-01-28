import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer' })
  priceAmount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'integer' })
  stockUnits!: number;
}
