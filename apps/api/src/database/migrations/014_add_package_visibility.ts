import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsVisibleToPackages1714486800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_packages" ADD COLUMN IF NOT EXISTS "is_visible" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("product_packages", "is_visible");
    }
}
