import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsVisibleToPackages1714486800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "product_packages",
            new TableColumn({
                name: "is_visible",
                type: "boolean",
                default: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("product_packages", "is_visible");
    }
}
