import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminEmailToSettings1714320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings 
      ADD COLUMN admin_email VARCHAR(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_settings 
      DROP COLUMN admin_email
    `);
  }
}
