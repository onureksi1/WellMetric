import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDueAtToSurveyTokens1745800400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE survey_tokens 
            ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE survey_tokens 
            DROP COLUMN IF EXISTS due_at;
        `);
    }
}
