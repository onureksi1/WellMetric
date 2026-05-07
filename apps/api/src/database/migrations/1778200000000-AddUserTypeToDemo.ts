import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypeToDemo1778200000000 implements MigrationInterface {
  name = 'AddUserTypeToDemo1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_type column if not exists
    const hasUserType = await queryRunner.hasColumn('demo_requests', 'user_type');
    if (!hasUserType) {
      await queryRunner.query(
        `ALTER TABLE "demo_requests" ADD "user_type" character varying(50)`,
      );
    }

    // Add user_type_category column if not exists (safety check)
    const hasCategory = await queryRunner.hasColumn('demo_requests', 'user_type_category');
    if (!hasCategory) {
      await queryRunner.query(
        `ALTER TABLE "demo_requests" ADD "user_type_category" character varying(50)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasUserType = await queryRunner.hasColumn('demo_requests', 'user_type');
    if (hasUserType) {
      await queryRunner.query(`ALTER TABLE "demo_requests" DROP COLUMN "user_type"`);
    }
  }
}
