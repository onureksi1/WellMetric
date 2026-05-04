import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmployeesTable1714750000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hesapsız çalışanlar için ayrı tablo
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                department_id UUID REFERENCES departments(id),
                full_name     VARCHAR(200) NOT NULL,
                email         VARCHAR(200) NOT NULL,
                position      VARCHAR(200),
                start_date    DATE,
                is_active     BOOLEAN DEFAULT true,
                created_at    TIMESTAMPTZ DEFAULT NOW(),
                updated_at    TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(company_id, email)
            );

            CREATE INDEX idx_employees_company
                ON employees(company_id, is_active);

            CREATE INDEX idx_employees_email
                ON employees(company_id, email);
        `);

        // survey_tokens tablosunu güncelle
        await queryRunner.query(`
            ALTER TABLE survey_tokens
                ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id),
                ADD COLUMN IF NOT EXISTS pin_code    VARCHAR(6);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE survey_tokens DROP COLUMN IF EXISTS employee_id`);
        await queryRunner.query(`ALTER TABLE survey_tokens DROP COLUMN IF EXISTS pin_code`);
        await queryRunner.query(`DROP TABLE IF EXISTS employees`);
    }
}
