import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminUsers1769570405000 implements MigrationInterface {
  name = 'AddAdminUsers1769570405000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email varchar(200) NOT NULL UNIQUE,
        full_name varchar(200) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'ADMIN',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS admin_users');
  }
}
