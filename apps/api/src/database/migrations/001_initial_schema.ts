import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 001_initial_schema
 *
 * Creates all 18 tables in FK-safe order:
 *  1.  companies
 *  2.  departments
 *  3.  users
 *  4.  invitations
 *  6.  surveys              (before survey_tokens which refs surveys)
 *  7.  survey_questions
 *  8.  survey_assignments   (before survey_tokens which refs survey_assignments)
 *  5.  survey_tokens        (refs surveys + survey_assignments)
 *  9.  survey_throttle
 *  10. survey_responses     (refs survey_tokens + users + companies + departments)
 *  11. draft_responses
 *  12. response_answers
 *  13. wellbeing_scores
 *  14. platform_settings
 *  15. content_items
 *  16. actions              (refs content_items)
 *  17. ai_insights
 *  18. audit_logs
 *
 * Source: Wellbeing_Sistem_Mimarisi_v1.7.docx — Bölüm 2
 */
export class InitialSchema1745750400000 implements MigrationInterface {
  public readonly name = 'InitialSchema1745750400000';

  // ────────────────────────────────────────────────────────────────────────────
  // UP
  // ────────────────────────────────────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enable pgcrypto for gen_random_uuid() ──────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ── 1. COMPANIES ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE companies (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(200) NOT NULL,
        slug            VARCHAR(100) UNIQUE NOT NULL,
        industry        VARCHAR(100),
        size_band       VARCHAR(20),
        plan            VARCHAR(20) NOT NULL DEFAULT 'starter',
        plan_expires_at TIMESTAMPTZ,
        is_active       BOOLEAN NOT NULL DEFAULT true,
        contact_email   VARCHAR(200),
        logo_url        TEXT,
        settings        JSONB NOT NULL DEFAULT '{
          "employee_accounts": false,
          "anonymity_threshold": 5,
          "benchmark_visible": true,
          "default_language": "tr"
        }',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by      UUID
      )
    `);

    // ── 2. DEPARTMENTS ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE departments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name       VARCHAR(150) NOT NULL,
        is_active  BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (company_id, name)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_dept_company ON departments(company_id)
    `);

    // ── 3. USERS ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID REFERENCES companies(id),
        department_id   UUID REFERENCES departments(id),
        email           VARCHAR(200) UNIQUE NOT NULL,
        password_hash   TEXT,
        full_name       VARCHAR(200),
        role            VARCHAR(20) NOT NULL,
        position        VARCHAR(100),
        location        VARCHAR(100),
        seniority       VARCHAR(20),
        age_group       VARCHAR(20),
        gender          VARCHAR(20),
        start_date      DATE,
        language        VARCHAR(10) NOT NULL DEFAULT 'tr',
        is_active       BOOLEAN NOT NULL DEFAULT true,
        last_login_at   TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_users_company      ON users(company_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_users_company_role ON users(company_id, role)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_users_dept         ON users(department_id)
    `);

    // ── 4. INVITATIONS ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE invitations (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID REFERENCES companies(id),
        token      VARCHAR(128) UNIQUE NOT NULL,
        type       VARCHAR(30) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at    TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_inv_token ON invitations(token)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_inv_user  ON invitations(user_id)
    `);

    // ── 6. SURVEYS (before survey_tokens) ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE surveys (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID REFERENCES companies(id),
        title_tr        VARCHAR(300) NOT NULL,
        title_en        VARCHAR(300),
        description_tr  TEXT,
        description_en  TEXT,
        type            VARCHAR(20) NOT NULL,
        frequency       VARCHAR(20),
        is_anonymous    BOOLEAN NOT NULL DEFAULT true,
        is_active       BOOLEAN NOT NULL DEFAULT true,
        throttle_days   INT NOT NULL DEFAULT 7,
        starts_at       TIMESTAMPTZ,
        ends_at         TIMESTAMPTZ,
        created_by      UUID REFERENCES users(id),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ── 7. SURVEY_QUESTIONS ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE survey_questions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id        UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        dimension        VARCHAR(30) NOT NULL,
        question_text_tr TEXT NOT NULL,
        question_text_en TEXT,
        question_type    VARCHAR(20) NOT NULL DEFAULT 'likert5',
        is_reversed      BOOLEAN NOT NULL DEFAULT false,
        weight           DECIMAL(3,2) NOT NULL DEFAULT 1.00,
        order_index      INT NOT NULL,
        is_required      BOOLEAN NOT NULL DEFAULT true,
        is_active        BOOLEAN NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_sq_survey ON survey_questions(survey_id, order_index)
    `);

    // ── 8. SURVEY_ASSIGNMENTS (before survey_tokens) ──────────────────────────
    await queryRunner.query(`
      CREATE TABLE survey_assignments (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id     UUID NOT NULL REFERENCES surveys(id),
        company_id    UUID REFERENCES companies(id),
        department_id UUID REFERENCES departments(id),
        assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        due_at        TIMESTAMPTZ NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'active',
        period        VARCHAR(7),
        UNIQUE (survey_id, company_id, period)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_assign_company ON survey_assignments(company_id, status)
    `);

    // ── 5. SURVEY_TOKENS (after surveys + survey_assignments) ─────────────────
    await queryRunner.query(`
      CREATE TABLE survey_tokens (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token         VARCHAR(128) UNIQUE NOT NULL,
        survey_id     UUID REFERENCES surveys(id),
        assignment_id UUID REFERENCES survey_assignments(id),
        company_id    UUID REFERENCES companies(id),
        department_id UUID REFERENCES departments(id),
        email         VARCHAR(200) NOT NULL,
        full_name     VARCHAR(200),
        language      VARCHAR(10) NOT NULL DEFAULT 'tr',
        position      VARCHAR(100),
        location      VARCHAR(100),
        seniority     VARCHAR(20),
        age_group     VARCHAR(20),
        gender        VARCHAR(20),
        start_date    DATE,
        is_used       BOOLEAN NOT NULL DEFAULT false,
        used_at       TIMESTAMPTZ,
        expires_at    TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_stokens_token   ON survey_tokens(token)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_stokens_company ON survey_tokens(company_id, survey_id)
    `);

    // ── 9. SURVEY_THROTTLE ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE survey_throttle (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id      UUID REFERENCES companies(id),
        last_survey_at  TIMESTAMPTZ NOT NULL,
        next_allowed_at TIMESTAMPTZ NOT NULL,
        UNIQUE (user_id)
      )
    `);

    // ── 10. SURVEY_RESPONSES ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE survey_responses (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id       UUID REFERENCES surveys(id),
        assignment_id   UUID REFERENCES survey_assignments(id),
        survey_token_id UUID REFERENCES survey_tokens(id),
        user_id         UUID REFERENCES users(id),
        company_id      UUID REFERENCES companies(id),
        department_id   UUID REFERENCES departments(id),
        position        VARCHAR(100),
        location        VARCHAR(100),
        seniority       VARCHAR(20),
        age_group       VARCHAR(20),
        gender          VARCHAR(20),
        tenure_months   INT,
        is_anonymous    BOOLEAN NOT NULL DEFAULT true,
        submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completion_pct  INT NOT NULL DEFAULT 100
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_resp_company   ON survey_responses(company_id, survey_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_resp_dept      ON survey_responses(department_id, survey_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_resp_location  ON survey_responses(company_id, location)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_resp_seniority ON survey_responses(company_id, seniority)
    `);

    // ── 11. DRAFT_RESPONSES ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE draft_responses (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id       UUID REFERENCES surveys(id),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        answers_json    JSONB NOT NULL DEFAULT '{}',
        last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (survey_id, user_id)
      )
    `);

    // ── 12. RESPONSE_ANSWERS ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE response_answers (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id  UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
        question_id  UUID REFERENCES survey_questions(id),
        dimension    VARCHAR(30),
        answer_value INT,
        answer_text  TEXT,
        score        DECIMAL(5,2)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_answers_response  ON response_answers(response_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_answers_dimension ON response_answers(question_id, dimension)
    `);

    // ── 13. WELLBEING_SCORES ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE wellbeing_scores (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id       UUID REFERENCES companies(id),
        department_id    UUID REFERENCES departments(id),
        survey_id        UUID REFERENCES surveys(id),
        period           VARCHAR(7) NOT NULL,
        dimension        VARCHAR(30) NOT NULL,
        segment_type     VARCHAR(20),
        segment_value    VARCHAR(50),
        score            DECIMAL(5,2),
        respondent_count INT,
        calculated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (company_id, department_id, survey_id, period, dimension, segment_type, segment_value)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_scores_company ON wellbeing_scores(company_id, period)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_scores_segment ON wellbeing_scores(company_id, segment_type, period)
    `);

    // ── 14. PLATFORM_SETTINGS ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE platform_settings (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- AI
        ai_provider_default   VARCHAR(30)  NOT NULL DEFAULT 'anthropic',
        ai_model_default      VARCHAR(100) NOT NULL DEFAULT 'claude-opus-4-5',
        ai_task_models        JSONB        NOT NULL DEFAULT '{
          "open_text_summary": {"provider": "anthropic", "model": "claude-opus-4-5"},
          "risk_alert":        {"provider": "openai",    "model": "gpt-4o"},
          "action_suggestion": {"provider": "anthropic", "model": "claude-sonnet-4-5"},
          "trend_analysis":    {"provider": "google",    "model": "gemini-2.0-flash"},
          "hr_chat":           {"provider": "anthropic", "model": "claude-opus-4-5"},
          "admin_anomaly":     {"provider": "openai",    "model": "gpt-4o"}
        }',
        ai_max_tokens         INT          NOT NULL DEFAULT 2000,
        ai_temperature        DECIMAL(2,1) NOT NULL DEFAULT 0.3,
        ai_enabled            BOOLEAN      NOT NULL DEFAULT true,

        -- Mail
        mail_provider         VARCHAR(30)  NOT NULL DEFAULT 'resend',
        mail_from_address     VARCHAR(200),
        mail_from_name        VARCHAR(200),
        mail_api_key          TEXT,
        mail_smtp_host        VARCHAR(200),
        mail_smtp_port        INT,
        mail_smtp_user        VARCHAR(200),
        mail_smtp_pass        TEXT,

        -- Storage
        storage_provider      VARCHAR(20)  NOT NULL DEFAULT 'cloudflare_r2',
        storage_bucket        VARCHAR(200),
        storage_region        VARCHAR(50),
        storage_endpoint      TEXT,
        storage_access_key    TEXT,
        storage_secret_key    TEXT,

        -- General
        platform_name         VARCHAR(200) NOT NULL DEFAULT 'Wellbeing Platformu',
        platform_url          VARCHAR(200),
        supported_languages   JSONB        NOT NULL DEFAULT '["tr","en"]',
        default_language      VARCHAR(10)  NOT NULL DEFAULT 'tr',
        anonymity_threshold   INT          NOT NULL DEFAULT 5,
        score_alert_threshold INT          NOT NULL DEFAULT 45,

        -- API keys (AES-256 encrypted at application layer)
        api_keys              JSONB        NOT NULL DEFAULT '{}',

        updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_by            UUID REFERENCES users(id)
      )
    `);

    // Seed: singleton row
    await queryRunner.query(`
      INSERT INTO platform_settings (
        platform_name,
        platform_url,
        mail_from_address,
        mail_from_name
      ) VALUES (
        'Wellbeing Platformu',
        'https://app.wellanalytics.io',
        'noreply@wellanalytics.io',
        'Wellbeing Platformu'
      )
    `);

    // ── 15. CONTENT_ITEMS ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE content_items (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title_tr       VARCHAR(300) NOT NULL,
        title_en       VARCHAR(300),
        description_tr TEXT,
        description_en TEXT,
        type           VARCHAR(30) NOT NULL,
        dimension      VARCHAR(30),
        url_tr         TEXT,
        url_en         TEXT,
        score_threshold INT,
        is_active      BOOLEAN NOT NULL DEFAULT true,
        created_by     UUID REFERENCES users(id),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_content_dimension ON content_items(dimension, score_threshold)
    `);

    // ── 16. ACTIONS ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE actions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID REFERENCES companies(id),
        department_id   UUID REFERENCES departments(id),
        dimension       VARCHAR(30),
        title           VARCHAR(300) NOT NULL,
        description     TEXT,
        content_item_id UUID REFERENCES content_items(id),
        status          VARCHAR(20) NOT NULL DEFAULT 'planned',
        due_date        DATE,
        created_by      UUID REFERENCES users(id),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_actions_company ON actions(company_id, status)
    `);

    // ── 17. AI_INSIGHTS ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE ai_insights (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id    UUID REFERENCES companies(id),
        department_id UUID REFERENCES departments(id),
        survey_id     UUID REFERENCES surveys(id),
        period        VARCHAR(7),
        insight_type  VARCHAR(30) NOT NULL,
        content       TEXT NOT NULL,
        metadata      JSONB NOT NULL DEFAULT '{}',
        generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_insights_company ON ai_insights(company_id, period)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_insights_type    ON ai_insights(company_id, insight_type, period)
    `);

    // ── 18. AUDIT_LOGS ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id),
        company_id  UUID,
        action      VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id   UUID,
        payload     JSONB,
        ip_address  INET,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_user    ON audit_logs(user_id,    created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_company ON audit_logs(company_id, created_at DESC)
    `);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DOWN — drops in reverse FK order
  // ────────────────────────────────────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs       CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_insights      CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS actions          CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS content_items    CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS platform_settings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS wellbeing_scores CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS response_answers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS draft_responses  CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_responses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_throttle  CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_tokens    CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_questions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS surveys          CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS invitations      CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users            CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments      CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS companies        CASCADE`);
  }
}
