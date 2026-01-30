import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageUrls1769570402000 implements MigrationInterface {
  name = 'AddProductImageUrls1769570402000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_urls'
        ) THEN
          ALTER TABLE products ADD COLUMN image_urls jsonb;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_url'
        ) THEN
          UPDATE products
          SET image_urls = CASE
            WHEN image_url IS NULL THEN '[]'::jsonb
            ELSE jsonb_build_array(image_url)
          END
          WHERE image_urls IS NULL;
          ALTER TABLE products DROP COLUMN image_url;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE products ADD COLUMN image_url text;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_urls'
        ) THEN
          UPDATE products
          SET image_url = CASE
            WHEN image_urls IS NULL OR jsonb_array_length(image_urls) = 0
              THEN NULL
            ELSE image_urls->>0
          END
          WHERE image_url IS NULL;
          ALTER TABLE products DROP COLUMN image_urls;
        END IF;
      END $$;
    `);
  }
}
