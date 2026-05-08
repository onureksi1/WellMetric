import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformLogoUrl1778234000000 implements MigrationInterface {
  public readonly name = 'AddPlatformLogoUrl1778234000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS platform_logo_url TEXT,
        ADD COLUMN IF NOT EXISTS admin_email        VARCHAR(200);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings
        DROP COLUMN IF EXISTS platform_logo_url,
        DROP COLUMN IF EXISTS admin_email;
    `);
  }
}
