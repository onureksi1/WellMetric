import { MigrationInterface, QueryRunner } from "typeorm";

export class BillingSystem0131777559000000 implements MigrationInterface {
    name = 'BillingSystem0131777559000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create credit_types table
        await queryRunner.query(`
            CREATE TABLE credit_types (
                key VARCHAR(50) PRIMARY KEY,
                label_tr VARCHAR(100) NOT NULL,
                label_en VARCHAR(100) NOT NULL,
                description_tr TEXT,
                description_en TEXT,
                icon VARCHAR(50) DEFAULT 'Brain',
                color VARCHAR(20) DEFAULT '#6C3A8E',
                sort_order INT DEFAULT 1,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create product_packages table
        await queryRunner.query(`
            CREATE TABLE product_packages (
                key VARCHAR(100) PRIMARY KEY,
                type VARCHAR(20) NOT NULL, -- 'subscription' | 'credit'
                label_tr VARCHAR(200) NOT NULL,
                label_en VARCHAR(200) NOT NULL,
                description_tr TEXT,
                description_en TEXT,
                price_monthly DECIMAL(10, 2),
                price_yearly DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'TRY',
                credits JSONB DEFAULT '{}', -- { 'ai_credit': 100, ... }
                max_companies INT,
                max_employees INT,
                ai_enabled BOOLEAN DEFAULT false,
                white_label BOOLEAN DEFAULT false,
                sort_order INT DEFAULT 1,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Create subscriptions table
        await queryRunner.query(`
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                consultant_id UUID NOT NULL REFERENCES users(id),
                package_key VARCHAR(100) NOT NULL REFERENCES product_packages(key),
                status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'past_due', 'canceled', 'expired'
                interval VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
                current_period_start TIMESTAMP NOT NULL,
                current_period_end TIMESTAMP NOT NULL,
                cancel_at_period_end BOOLEAN DEFAULT false,
                provider VARCHAR(50), -- 'stripe', 'iyzico', etc.
                provider_subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Create credit_balances table
        await queryRunner.query(`
            CREATE TABLE credit_balances (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                consultant_id UUID NOT NULL REFERENCES users(id),
                credit_type_key VARCHAR(50) NOT NULL REFERENCES credit_types(key),
                balance INT NOT NULL DEFAULT 0, -- -1 for unlimited
                used_this_month INT NOT NULL DEFAULT 0,
                last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(consultant_id, credit_type_key)
            )
        `);

        // 5. Create credit_transactions table
        await queryRunner.query(`
            CREATE TABLE credit_transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                consultant_id UUID NOT NULL REFERENCES users(id),
                credit_type_key VARCHAR(50) NOT NULL REFERENCES credit_types(key),
                amount INT NOT NULL,
                type VARCHAR(20) NOT NULL, -- 'purchase', 'usage', 'bonus', 'reset', 'refund'
                description TEXT,
                company_id UUID REFERENCES companies(id),
                reference_id VARCHAR(100), -- payment_id or AI task ID
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Create payments table
        await queryRunner.query(`
            CREATE TABLE payments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                consultant_id UUID NOT NULL REFERENCES users(id),
                subscription_id UUID REFERENCES subscriptions(id),
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
                provider VARCHAR(50) NOT NULL,
                provider_payment_id VARCHAR(255),
                invoice_url TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 7. Seed Data: Credit Types
        await queryRunner.query(`
            INSERT INTO credit_types (key, label_tr, label_en, icon, color, sort_order)
            VALUES 
                ('ai_credit', 'AI Analiz Kredisi', 'AI Analysis Credit', 'Brain', '#6C3A8E', 1),
                ('mail_credit', 'Mail Kredisi', 'Mail Credit', 'Mail', '#1A5C3A', 2)
        `);

        // 8. Update platform_settings for credit costs
        await queryRunner.query(`
            UPDATE platform_settings SET
              credit_costs = '{
                "intelligence_report": {"ai_credit": 10},
                "comparative_insight":  {"ai_credit": 5},
                "hr_chat":              {"ai_credit": 1},
                "admin_chat":           {"ai_credit": 1},
                "ai_insight":           {"ai_credit": 2},
                "open_text_summary":    {"ai_credit": 2},
                "risk_alert":           {"ai_credit": 1},
                "mail_send":            {"mail_credit": 1}
              }'::jsonb
            WHERE id IS NOT NULL
        `);

        // 9. Seed Data: Product Packages
        await queryRunner.query(`
            INSERT INTO product_packages 
            (key, type, label_tr, label_en, price_monthly, price_yearly, currency, credits, max_companies, max_employees, ai_enabled, white_label, sort_order)
            VALUES
              ('starter_monthly','subscription','Starter Aylık','Starter Monthly',299,null,'TRY','{"ai_credit":1000,"mail_credit":5000}',5,100,false,false,1),
              ('starter_yearly','subscription','Starter Yıllık','Starter Yearly',null,2990,'TRY','{"ai_credit":1000,"mail_credit":5000}',5,100,false,false,2),
              ('growth_monthly','subscription','Growth Aylık','Growth Monthly',799,null,'TRY','{"ai_credit":5000,"mail_credit":25000}',20,500,true,false,3),
              ('growth_yearly','subscription','Growth Yıllık','Growth Yearly',null,7990,'TRY','{"ai_credit":5000,"mail_credit":25000}',20,500,true,false,4),
              ('enterprise_monthly','subscription','Enterprise Aylık','Enterprise Monthly',1999,null,'TRY','{"ai_credit":-1,"mail_credit":-1}',null,null,true,true,5),
              ('enterprise_yearly','subscription','Enterprise Yıllık','Enterprise Yearly',null,19990,'TRY','{"ai_credit":-1,"mail_credit":-1}',null,null,true,true,6),
              ('ai_100','credit','100 AI Kredi','100 AI Credits',49,null,'TRY','{"ai_credit":100}',null,null,false,false,10),
              ('ai_500','credit','500 AI Kredi','500 AI Credits',199,null,'TRY','{"ai_credit":500}',null,null,false,false,11),
              ('ai_1000','credit','1000 AI Kredi','1000 AI Credits',349,null,'TRY','{"ai_credit":1000}',null,null,false,false,12),
              ('mail_1000','credit','1000 Mail Kredisi','1000 Mail Credits',29,null,'TRY','{"mail_credit":1000}',null,null,false,false,20),
              ('mail_5000','credit','5000 Mail Kredisi','5000 Mail Credits',99,null,'TRY','{"mail_credit":5000}',null,null,false,false,21),
              ('mail_10000','credit','10000 Mail Kredisi','10000 Mail Credits',179,null,'TRY','{"mail_credit":10000}',null,null,false,false,22)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS payments`);
        await queryRunner.query(`DROP TABLE IF EXISTS credit_transactions`);
        await queryRunner.query(`DROP TABLE IF EXISTS credit_balances`);
        await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
        await queryRunner.query(`DROP TABLE IF EXISTS product_packages`);
        await queryRunner.query(`DROP TABLE IF EXISTS credit_types`);
    }
}
