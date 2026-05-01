import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsultantPackages0111714335000000 implements MigrationInterface {
    name = 'ConsultantPackages0111714335000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add consultant_packages to platform_settings
        await queryRunner.query(`
            ALTER TABLE platform_settings 
            ADD COLUMN IF NOT EXISTS consultant_packages JSONB DEFAULT '{}'
        `);

        // 2. Seed default packages
        const defaultPackages = {
            starter: {
                label_tr: "Starter",
                label_en: "Starter",
                max_companies: 5,
                max_employees: 100,
                ai_enabled: false,
                white_label: false,
                description_tr: "5 firmaya kadar, AI yok",
                description_en: "Up to 5 companies, no AI"
            },
            growth: {
                label_tr: "Growth",
                label_en: "Growth",
                max_companies: 20,
                max_employees: 500,
                ai_enabled: true,
                white_label: false,
                description_tr: "20 firmaya kadar, tam AI",
                description_en: "Up to 20 companies, full AI"
            },
            enterprise: {
                label_tr: "Enterprise",
                label_en: "Enterprise",
                max_companies: null,
                max_employees: null,
                ai_enabled: true,
                white_label: true,
                description_tr: "Sınırsız firma + white-label",
                description_en: "Unlimited + white-label"
            }
        };

        await queryRunner.query(`
            UPDATE platform_settings 
            SET consultant_packages = $1
            WHERE consultant_packages = '{}' OR consultant_packages IS NULL
        `, [JSON.stringify(defaultPackages)]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE platform_settings 
            DROP COLUMN IF EXISTS consultant_packages
        `);
    }
}
