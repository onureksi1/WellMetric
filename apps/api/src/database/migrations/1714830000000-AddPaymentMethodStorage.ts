import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentMethodStorage1714830000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Kayıtlı ödeme yöntemi bilgileri
            -- Stripe customer ve payment method
            ALTER TABLE subscriptions
                ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(200),
                ADD COLUMN IF NOT EXISTS stripe_customer_id       VARCHAR(200),
                ADD COLUMN IF NOT EXISTS retry_count              INT DEFAULT 0,
                ADD COLUMN IF NOT EXISTS last_retry_at            TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS past_due_since           TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS iyzico_card_token        VARCHAR(500),
                ADD COLUMN IF NOT EXISTS iyzico_card_user_key     VARCHAR(500);

            -- Consultant bazlı ödeme yöntemi tercihini sakla
            CREATE TABLE IF NOT EXISTS consultant_payment_methods (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultant_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider        VARCHAR(20) NOT NULL,  -- 'stripe'|'iyzico'|'paytr'
                is_default      BOOLEAN DEFAULT false,
                -- Stripe
                stripe_customer_id      VARCHAR(200),
                stripe_payment_method_id VARCHAR(200),
                stripe_last4            VARCHAR(4),
                stripe_brand            VARCHAR(20),   -- 'visa', 'mastercard'
                -- iyzico
                iyzico_card_user_key    VARCHAR(500),
                iyzico_card_token       VARCHAR(500),
                iyzico_card_alias       VARCHAR(200),
                iyzico_last4            VARCHAR(4),
                -- Ortak
                expires_month   VARCHAR(2),
                expires_year    VARCHAR(4),
                created_at      TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(consultant_id, provider)
            );

            CREATE INDEX IF NOT EXISTS idx_payment_methods_consultant
                ON consultant_payment_methods(consultant_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS consultant_payment_methods;
            ALTER TABLE subscriptions
                DROP COLUMN IF EXISTS stripe_payment_method_id,
                DROP COLUMN IF EXISTS stripe_customer_id,
                DROP COLUMN IF EXISTS retry_count,
                DROP COLUMN IF EXISTS last_retry_at,
                DROP COLUMN IF EXISTS past_due_since,
                DROP COLUMN IF EXISTS iyzico_card_token,
                DROP COLUMN IF EXISTS iyzico_card_user_key;
        `);
    }
}
