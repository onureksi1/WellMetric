import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeDeleteSupport1714760000000 implements MigrationInterface {
  name = 'AddEmployeeDeleteSupport1714760000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Pasife alma tarihini tut (CRON için)
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

      -- survey_tokens: employee_id zaten nullable — FK'yı ON DELETE SET NULL yap
      ALTER TABLE survey_tokens
        DROP CONSTRAINT IF EXISTS "FK_survey_tokens_employee_id",
        DROP CONSTRAINT IF EXISTS survey_tokens_employee_id_fkey;

      ALTER TABLE survey_tokens
        ADD CONSTRAINT survey_tokens_employee_id_fkey
          FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE SET NULL;


    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE employees DROP COLUMN IF EXISTS deactivated_at;

      ALTER TABLE survey_tokens
        DROP CONSTRAINT IF EXISTS survey_tokens_employee_id_fkey;


    `);
  }
}
