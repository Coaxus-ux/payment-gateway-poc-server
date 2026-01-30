import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1769570400000 implements MigrationInterface {
  name = 'InitSchema1769570400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE products (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(200) NOT NULL,
        description text,
        image_urls jsonb,
        price_amount integer NOT NULL,
        currency varchar(10) NOT NULL,
        stock_units integer NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE customers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email varchar(200) NOT NULL UNIQUE,
        full_name varchar(200) NOT NULL,
        phone varchar(50)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE deliveries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        address_line1 varchar(200) NOT NULL,
        address_line2 varchar(200),
        city varchar(100) NOT NULL,
        country varchar(100) NOT NULL,
        postal_code varchar(20)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE transactions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id uuid NOT NULL REFERENCES customers(id),
        delivery_id uuid NOT NULL REFERENCES deliveries(id),
        status varchar(20) NOT NULL,
        provider_ref varchar(200),
        failure_reason varchar(200),
        amount integer NOT NULL,
        currency varchar(10) NOT NULL,
        card_last4 varchar(4),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        version integer NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE transaction_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity integer NOT NULL,
        unit_price_amount integer NOT NULL,
        currency varchar(10) NOT NULL,
        product_snapshot jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS transaction_items');
    await queryRunner.query('DROP TABLE IF EXISTS transactions');
    await queryRunner.query('DROP TABLE IF EXISTS deliveries');
    await queryRunner.query('DROP TABLE IF EXISTS customers');
    await queryRunner.query('DROP TABLE IF EXISTS products');
  }
}
