import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageUrl1769570401000
  implements MigrationInterface
{
  name = 'AddProductImageUrl1769570401000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE products ADD COLUMN image_url text');
    await queryRunner.query(
      'ALTER TABLE transactions ADD COLUMN product_image_url text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE transactions DROP COLUMN product_image_url',
    );
    await queryRunner.query('ALTER TABLE products DROP COLUMN image_url');
  }
}
