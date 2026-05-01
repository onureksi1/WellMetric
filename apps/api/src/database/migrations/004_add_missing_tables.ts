import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingTables1745950400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. survey_question_options
    await queryRunner.query(`
      CREATE TABLE survey_question_options (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        label_tr     VARCHAR(255) NOT NULL,
        label_en     VARCHAR(255),
        value        INT,
        order_index  INT NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sq_options_q ON survey_question_options(question_id)`);

    // 2. survey_question_rows
    await queryRunner.query(`
      CREATE TABLE survey_question_rows (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        label_tr     VARCHAR(255) NOT NULL,
        label_en     VARCHAR(255),
        dimension    VARCHAR(30),
        order_index  INT NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sq_rows_q ON survey_question_rows(question_id)`);

    // 3. response_answer_selections
    await queryRunner.query(`
      CREATE TABLE response_answer_selections (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id  UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
        question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        option_id    UUID NOT NULL REFERENCES survey_question_options(id) ON DELETE CASCADE,
        rank_order   INT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_ras_response ON response_answer_selections(response_id)`);

    // 4. distribution_campaigns
    await queryRunner.query(`
      CREATE TABLE distribution_campaigns (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        survey_id         UUID NOT NULL REFERENCES surveys(id),
        assignment_id     UUID REFERENCES survey_assignments(id),
        period            VARCHAR(7),
        created_by        UUID NOT NULL,
        trigger_type      VARCHAR(20) NOT NULL DEFAULT 'hr_manual',
        scheduled_at      TIMESTAMPTZ,
        sent_at           TIMESTAMPTZ,
        total_recipients  INT NOT NULL DEFAULT 0,
        sent_count        INT NOT NULL DEFAULT 0,
        delivered_count   INT NOT NULL DEFAULT 0,
        opened_count      INT NOT NULL DEFAULT 0,
        clicked_count     INT NOT NULL DEFAULT 0,
        completed_count   INT NOT NULL DEFAULT 0,
        status            VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_dc_company ON distribution_campaigns(company_id)`);

    // 5. distribution_logs
    await queryRunner.query(`
      CREATE TABLE distribution_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id     UUID NOT NULL REFERENCES distribution_campaigns(id) ON DELETE CASCADE,
        survey_token_id UUID REFERENCES survey_tokens(id),
        email           VARCHAR(200) NOT NULL,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending',
        error_message   TEXT,
        sent_at         TIMESTAMPTZ,
        delivered_at    TIMESTAMPTZ,
        opened_at       TIMESTAMPTZ,
        clicked_at      TIMESTAMPTZ,
        completed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_dl_campaign ON distribution_logs(campaign_id)`);
    await queryRunner.query(`CREATE INDEX idx_dl_token    ON distribution_logs(survey_token_id)`);

    // 6. Update survey_questions with missing matrix and number fields if not present
    // (Check 001, it had some but not matrix_label)
    await queryRunner.query(`
      ALTER TABLE survey_questions
        ADD COLUMN IF NOT EXISTS matrix_label_tr TEXT,
        ADD COLUMN IF NOT EXISTS matrix_label_en TEXT,
        ADD COLUMN IF NOT EXISTS number_min INT,
        ADD COLUMN IF NOT EXISTS number_max INT,
        ADD COLUMN IF NOT EXISTS number_step INT DEFAULT 1;
    `);

    // 7. Update response_answers with missing row/option refs
    await queryRunner.query(`
      ALTER TABLE response_answers
        ADD COLUMN IF NOT EXISTS answer_row_id UUID REFERENCES survey_question_rows(id),
        ADD COLUMN IF NOT EXISTS answer_option_id UUID REFERENCES survey_question_options(id),
        ADD COLUMN IF NOT EXISTS answer_number INT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS distribution_logs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS distribution_campaigns CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS response_answer_selections CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_question_rows CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS survey_question_options CASCADE`);
  }
}
