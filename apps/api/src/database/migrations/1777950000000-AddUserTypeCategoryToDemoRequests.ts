import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTypeCategoryToDemoRequests1777950000000 implements MigrationInterface {
    name = 'AddUserTypeCategoryToDemoRequests1777950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists first to be safe
        const hasColumn = await queryRunner.hasColumn('demo_requests', 'user_type_category');
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "demo_requests" ADD "user_type_category" character varying(50)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "demo_requests" DROP COLUMN "user_type_category"`);
    }
}
