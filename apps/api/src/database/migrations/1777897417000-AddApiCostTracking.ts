import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApiCostTracking1777897417000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Her AI çağrısının gerçek maliyeti
            CREATE TABLE IF NOT EXISTS api_cost_logs (
                id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultant_id    UUID REFERENCES users(id),
                company_id       UUID REFERENCES companies(id),

                -- Hangi AI görevi
                task_type        VARCHAR(50) NOT NULL,
                -- 'open_text_summary'|'risk_alert'|'action_suggestion'
                -- |'trend_analysis'|'hr_chat'|'admin_anomaly'
                -- |'survey_ai_generate'|'comparative_insight'
                -- |'intelligence_report'

                -- Provider bilgisi
                provider         VARCHAR(30) NOT NULL,  -- 'anthropic'|'openai'|'google'
                model            VARCHAR(100) NOT NULL, -- 'claude-opus-4-5' vb.

                -- Token kullanımı
                input_tokens     INT NOT NULL DEFAULT 0,
                output_tokens    INT NOT NULL DEFAULT 0,
                total_tokens     INT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

                -- Gerçek maliyet (USD)
                -- Her model için sabit birim fiyat platform_settings'ten gelir
                cost_usd         DECIMAL(10,6) NOT NULL DEFAULT 0,

                -- Consultant'a satılan kredi karşılığı (TRY)
                -- credit_amount * platform_settings.ai_credit_price_try
                revenue_try      DECIMAL(10,2),

                -- Kâr = revenue_try - (cost_usd * usd_try_rate)
                -- Hesaplama admin dashboard'da yapılır

                -- Referans
                ai_insight_id    UUID REFERENCES ai_insights(id),
                credit_tx_id     UUID REFERENCES credit_transactions(id),

                duration_ms      INT,
                created_at       TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_api_cost_consultant
                ON api_cost_logs(consultant_id, created_at DESC);

            CREATE INDEX idx_api_cost_date
                ON api_cost_logs(created_at DESC);

            CREATE INDEX idx_api_cost_provider
                ON api_cost_logs(provider, model, created_at DESC);

            -- Model birim fiyatları (platform_settings JSONB'a ekle)
            -- Her 1000 token için USD fiyatı
            UPDATE platform_settings
            SET ai_task_models = COALESCE(ai_task_models, '{}'::jsonb) || '{
                "model_prices": {
                    "claude-opus-4-5":     {"input": 0.003,  "output": 0.015},
                    "claude-sonnet-4-5":   {"input": 0.003,  "output": 0.015},
                    "claude-haiku-4-5":    {"input": 0.00025,"output": 0.00125},
                    "gpt-4o":              {"input": 0.005,  "output": 0.015},
                    "gpt-4o-mini":         {"input": 0.00015,"output": 0.0006},
                    "gemini-2.0-flash":    {"input": 0.00015,"output": 0.0006},
                    "mistral-large":       {"input": 0.003,  "output": 0.009}
                }
            }'::jsonb
            WHERE id IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS api_cost_logs;`);
    }
}
