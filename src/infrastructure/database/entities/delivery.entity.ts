import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'deliveries' })
export class DeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  addressLine1!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;
}
