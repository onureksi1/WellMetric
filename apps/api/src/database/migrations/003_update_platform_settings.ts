import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlatformSettings1745850400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings
        DROP COLUMN IF EXISTS mail_api_key,
        DROP COLUMN IF EXISTS mail_smtp_host,
        DROP COLUMN IF EXISTS mail_smtp_port,
        DROP COLUMN IF EXISTS mail_smtp_user,
        DROP COLUMN IF EXISTS mail_smtp_pass,
        DROP COLUMN IF EXISTS storage_bucket,
        DROP COLUMN IF EXISTS storage_region,
        DROP COLUMN IF EXISTS storage_endpoint,
        DROP COLUMN IF EXISTS storage_access_key,
        DROP COLUMN IF EXISTS storage_secret_key,
        ADD COLUMN IF NOT EXISTS mail_config JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS storage_config JSONB DEFAULT '{}';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings
        DROP COLUMN IF EXISTS mail_config,
        DROP COLUMN IF EXISTS storage_config,
        ADD COLUMN IF NOT EXISTS mail_api_key TEXT,
        ADD COLUMN IF NOT EXISTS mail_smtp_host VARCHAR(200),
        ADD COLUMN IF NOT EXISTS mail_smtp_port INT,
        ADD COLUMN IF NOT EXISTS mail_smtp_user VARCHAR(200),
        ADD COLUMN IF NOT EXISTS mail_smtp_pass TEXT,
        ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(200),
        ADD COLUMN IF NOT EXISTS storage_region VARCHAR(50),
        ADD COLUMN IF NOT EXISTS storage_endpoint TEXT,
        ADD COLUMN IF NOT EXISTS storage_access_key TEXT,
        ADD COLUMN IF NOT EXISTS storage_secret_key TEXT;
    `);
  }
}
