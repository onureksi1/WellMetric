import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsultantLayer0081714330000000 implements MigrationInterface {
    name = 'ConsultantLayer0081714330000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Update users.role check constraint
        await queryRunner.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS users_role_check
        `);
        await queryRunner.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('super_admin', 'consultant', 'hr_admin', 'employee'))
        `);

        // 2. Add consultant_id to companies
        await queryRunner.query(`
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES users(id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_companies_consultant 
            ON companies(consultant_id)
        `);

        // 3. Create consultant_plans table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS consultant_plans (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultant_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                plan            VARCHAR(20) NOT NULL DEFAULT 'starter',
                max_companies   INT DEFAULT 5,
                max_employees   INT DEFAULT 100,
                ai_enabled      BOOLEAN DEFAULT true,
                white_label     BOOLEAN DEFAULT false,
                custom_domain   VARCHAR(200),
                valid_until     TIMESTAMPTZ,
                is_active       BOOLEAN DEFAULT true,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_consultant_plans 
            ON consultant_plans(consultant_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_consultant_plans`);
        await queryRunner.query(`DROP TABLE IF EXISTS consultant_plans`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_consultant`);
        await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS consultant_id`);

        await queryRunner.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS users_role_check
        `);
        await queryRunner.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('super_admin', 'hr_admin', 'employee'))
        `);
    }
}
