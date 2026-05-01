import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefineDemoAndDrafts1714319000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop existing tables if they exist to start fresh with new schema
    await queryRunner.query(`DROP TABLE IF EXISTS demo_requests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_drafts CASCADE`);

    // 2. Create demo_requests table as specified
    await queryRunner.query(`
      CREATE TABLE demo_requests (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name    VARCHAR(200) NOT NULL,
        email        VARCHAR(200) NOT NULL,
        company_name VARCHAR(200) NOT NULL,
        company_size VARCHAR(20),
        industry     VARCHAR(100),
        phone        VARCHAR(50),
        message      TEXT,
        status       VARCHAR(20) DEFAULT 'pending',
        notes        TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        assigned_to  UUID REFERENCES users(id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_demo_status
        ON demo_requests(status, created_at DESC);
    `);

    // 3. Create survey_drafts table as specified
    await queryRunner.query(`
      CREATE TABLE survey_drafts (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
        title        VARCHAR(300),
        draft_data   JSONB NOT NULL DEFAULT '{}',
        last_saved_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(created_by)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS survey_drafts`);
    await queryRunner.query(`DROP TABLE IF EXISTS demo_requests`);
  }
}
