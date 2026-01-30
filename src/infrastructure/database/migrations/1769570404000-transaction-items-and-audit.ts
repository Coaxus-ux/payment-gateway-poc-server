import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionItemsAndAudit1769570404000
  implements MigrationInterface
{
  name = 'TransactionItemsAndAudit1769570404000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()",
    );
    await queryRunner.query(
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()",
    );
    await queryRunner.query(
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS card_last4 varchar(4)",
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'transactions' AND column_name = 'product_id'
        ) THEN
          INSERT INTO transaction_items (
            transaction_id,
            product_id,
            quantity,
            unit_price_amount,
            currency,
            product_snapshot
          )
          SELECT
            id,
            product_id,
            quantity,
            product_price_amount,
            product_currency,
            jsonb_build_object(
              'id', product_id,
              'name', product_name,
              'description', product_description,
              'imageUrls', COALESCE(product_image_urls, '[]'::jsonb),
              'priceAmount', product_price_amount,
              'currency', product_currency
            )
          FROM transactions
          WHERE product_id IS NOT NULL
          ON CONFLICT DO NOTHING;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      'ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_product_id_fkey',
    );
    await queryRunner.query('ALTER TABLE transactions DROP COLUMN IF EXISTS product_id');
    await queryRunner.query('ALTER TABLE transactions DROP COLUMN IF EXISTS quantity');
    await queryRunner.query('ALTER TABLE transactions DROP COLUMN IF EXISTS product_name');
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS product_description',
    );
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS product_image_urls',
    );
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS product_price_amount',
    );
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS product_currency',
    );
    await queryRunner.query('ALTER TABLE transactions DROP COLUMN IF EXISTS items');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_id uuid',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS quantity integer',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_name varchar(200)',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_description text',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_image_urls jsonb',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_price_amount integer',
    );
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_currency varchar(10)',
    );

    await queryRunner.query(`
      UPDATE transactions t
      SET
        product_id = i.product_id,
        quantity = i.quantity,
        product_name = (i.product_snapshot->>'name'),
        product_description = (i.product_snapshot->>'description'),
        product_image_urls = COALESCE(i.product_snapshot->'imageUrls', '[]'::jsonb),
        product_price_amount = (i.product_snapshot->>'priceAmount')::integer,
        product_currency = (i.product_snapshot->>'currency')
      FROM (
        SELECT DISTINCT ON (transaction_id)
          transaction_id,
          product_id,
          quantity,
          product_snapshot
        FROM transaction_items
        ORDER BY transaction_id, created_at
      ) i
      WHERE t.id = i.transaction_id
    `);

    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS card_last4',
    );
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS created_at',
    );
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN IF EXISTS updated_at',
    );
    await queryRunner.query('DROP TABLE IF EXISTS transaction_items');
  }
}
