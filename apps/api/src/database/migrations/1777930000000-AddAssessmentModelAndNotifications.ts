import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssessmentModelAndNotifications1777930000000
  implements MigrationInterface {

  async up(queryRunner: QueryRunner): Promise<void> {

    // 1. companies.assessment_model
    await queryRunner.query(`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS assessment_model VARCHAR(30)
          DEFAULT 'wellbeing_metric'
          CHECK (assessment_model IN (
            'wellbeing_metric',
            'who5_gallup',
            'perma',
            'cipd'
          ));
    `);

    // 2. in_app_notifications tablosu
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        VARCHAR(60) NOT NULL,
        title_tr    VARCHAR(200) NOT NULL,
        title_en    VARCHAR(200) NOT NULL,
        body_tr     TEXT,
        body_en     TEXT,
        link        VARCHAR(300),
        is_read     BOOLEAN DEFAULT false,
        read_at     TIMESTAMPTZ,
        metadata    JSONB DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user
        ON in_app_notifications(user_id, is_read, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_notifications_unread
        ON in_app_notifications(user_id, created_at DESC)
        WHERE is_read = false;
    `);

    // 3. api_cost_logs yeni kolonlar
    await queryRunner.query(`
      ALTER TABLE api_cost_logs
        ADD COLUMN IF NOT EXISTS cost_try      DECIMAL(12,4) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS revenue_try   DECIMAL(12,4) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS credit_amount INT           DEFAULT 0,
        ADD COLUMN IF NOT EXISTS usd_try_rate  DECIMAL(8,4)  DEFAULT 0,
        ADD COLUMN IF NOT EXISTS provider      VARCHAR(50)   DEFAULT 'anthropic';
    `);

    // 4. platform_settings: assessment_models + model_prices
    await queryRunner.query(`
      UPDATE platform_settings
      SET settings = COALESCE(settings, '{}'::jsonb) || '{
        "assessment_models": {
          "wellbeing_metric": {
            "name_tr": "WellBeing Metric",
            "name_en": "WellBeing Metric",
            "framework": "WellBeing Metric Proprietary Framework",
            "dimensions": ["physical","mental","social","financial","work"]
          },
          "who5_gallup": {
            "name_tr": "WHO-5 + Gallup Q12",
            "name_en": "WHO-5 + Gallup Q12",
            "framework": "WHO-5 Wellbeing Index (1998) + Gallup Q12",
            "dimensions": ["mental_wellbeing","engagement","purpose","support","growth"]
          },
          "perma": {
            "name_tr": "PERMA Modeli (Seligman)",
            "name_en": "PERMA Model (Seligman)",
            "framework": "Seligman, M.E.P. (2011). Flourish. Free Press.",
            "dimensions": ["positive_emotion","engagement","relationships","meaning","achievement"]
          },
          "cipd": {
            "name_tr": "CIPD İş Yeri Wellbeing",
            "name_en": "CIPD Workplace Wellbeing",
            "framework": "CIPD Health and Wellbeing at Work Framework (2023)",
            "dimensions": ["health","engagement","work_life_balance","social","purpose"]
          }
        }
      }'::jsonb;
    `);

    await queryRunner.query(`
      UPDATE platform_settings
      SET ai_task_models = COALESCE(ai_task_models, '{}'::jsonb) || '{
        "model_prices": {
          "claude-haiku-4-5":           {"input": 0.80,  "output": 4.00,  "provider": "anthropic"},
          "claude-haiku-4-5-20251001":  {"input": 0.80,  "output": 4.00,  "provider": "anthropic"},
          "claude-sonnet-4-5":          {"input": 3.00,  "output": 15.00, "provider": "anthropic"},
          "claude-sonnet-4-6":          {"input": 3.00,  "output": 15.00, "provider": "anthropic"},
          "claude-opus-4-5":            {"input": 15.00, "output": 75.00, "provider": "anthropic"},
          "claude-opus-4-6":            {"input": 15.00, "output": 75.00, "provider": "anthropic"},
          "gpt-4o":                     {"input": 2.50,  "output": 10.00, "provider": "openai"},
          "gpt-4o-mini":                {"input": 0.15,  "output": 0.60,  "provider": "openai"},
          "gemini-2.5-pro":             {"input": 1.25,  "output": 10.00, "provider": "google"},
          "gemini-2.5-flash":           {"input": 0.30,  "output": 2.50,  "provider": "google"},
          "gemini-2.5-flash-lite":      {"input": 0.10,  "output": 0.40,  "provider": "google"},
          "mistral-large-latest":       {"input": 3.00,  "output": 9.00,  "provider": "mistral"},
          "mistral-small-latest":       {"input": 0.20,  "output": 0.60,  "provider": "mistral"}
        },
        "survey_generation":      {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"},
        "content_suggestion":     {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"},
        "insight_generation":     {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"},
        "chat":                   {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"},
        "action_recommendation":  {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"},
        "intelligence_report":    {"model": "claude-sonnet-4-6",         "provider": "anthropic"},
        "comparative_analysis":   {"model": "claude-sonnet-4-6",         "provider": "anthropic"}
      }'::jsonb;
    `);

    await queryRunner.query(`
      UPDATE platform_settings
      SET ai_task_models = ai_task_models || '{
        "task_credits": {
          "intelligence_report":    60,
          "comparative_analysis":   20,
          "survey_generation":      10,
          "content_suggestion":      5,
          "action_recommendation":   5,
          "insight_generation":      5,
          "onboarding_analysis":    10,
          "chat":                    2,
          "score_analysis":          5
        }
      }'::jsonb;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
        DROP COLUMN IF EXISTS assessment_model;
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS in_app_notifications;
    `);
    await queryRunner.query(`
      ALTER TABLE api_cost_logs
        DROP COLUMN IF EXISTS cost_try,
        DROP COLUMN IF EXISTS revenue_try,
        DROP COLUMN IF EXISTS credit_amount,
        DROP COLUMN IF EXISTS usd_try_rate,
        DROP COLUMN IF EXISTS provider;
    `);
  }
}
