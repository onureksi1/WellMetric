import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaymentSettingsToPlatformSettings1714486900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "platform_settings",
            new TableColumn({
                name: "payment_settings",
                type: "jsonb",
                isNullable: true,
                default: "'{}'::jsonb",
            })
        );

        // Initial seed for payment providers
        await queryRunner.query(`
            UPDATE platform_settings SET payment_settings = '{
                "providers": [
                    {"key": "stripe", "label": "Stripe", "enabled": true, "icon": "CreditCard"},
                    {"key": "iyzico", "label": "iyzico", "enabled": true, "icon": "CreditCard"},
                    {"key": "paytr", "label": "PayTR", "enabled": false, "icon": "CreditCard"},
                    {"key": "paypal", "label": "PayPal", "enabled": false, "icon": "CreditCard"}
                ]
            }'::jsonb
            WHERE id IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("platform_settings", "payment_settings");
    }
}
