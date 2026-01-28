import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'price_amount', type: 'integer' })
  priceAmount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ name: 'stock_units', type: 'integer' })
  stockUnits!: number;
}
