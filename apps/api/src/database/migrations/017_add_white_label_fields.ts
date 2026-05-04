import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhiteLabelFields1746500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE consultant_plans
        ADD COLUMN IF NOT EXISTS brand_name        VARCHAR(200),
        ADD COLUMN IF NOT EXISTS brand_logo_url    TEXT,
        ADD COLUMN IF NOT EXISTS brand_color       VARCHAR(7),
        ADD COLUMN IF NOT EXISTS brand_favicon_url TEXT,
        ADD COLUMN IF NOT EXISTS custom_domain     VARCHAR(200),
        ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_consultant_plans_domain
        ON consultant_plans(custom_domain)
        WHERE custom_domain IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_consultant_plans_domain;
      ALTER TABLE consultant_plans
        DROP COLUMN IF EXISTS brand_name,
        DROP COLUMN IF EXISTS brand_logo_url,
        DROP COLUMN IF EXISTS brand_color,
        DROP COLUMN IF EXISTS brand_favicon_url,
        DROP COLUMN IF EXISTS custom_domain,
        DROP COLUMN IF EXISTS custom_domain_verified;
    `);
  }
}
