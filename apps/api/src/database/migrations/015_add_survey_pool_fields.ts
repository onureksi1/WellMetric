import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSurveyPoolFields1746300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE surveys
        ADD COLUMN IF NOT EXISTS is_pool_visible BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS pool_added_at   TIMESTAMPTZ DEFAULT NOW();
    `);

    // Mevcut consultant anketlerini havuza dahil et
    // (type='company_specific' ve created_by NULL değil olanlar)
    await queryRunner.query(`
      UPDATE surveys
      SET is_pool_visible = true,
          pool_added_at   = created_at
      WHERE type = 'company_specific'
        AND created_by IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_surveys_pool
        ON surveys (is_pool_visible, pool_added_at DESC)
        WHERE type = 'company_specific';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_surveys_pool;`);
    await queryRunner.query(`
      ALTER TABLE surveys
        DROP COLUMN IF EXISTS is_pool_visible,
        DROP COLUMN IF EXISTS pool_added_at;
    `);
  }
}
