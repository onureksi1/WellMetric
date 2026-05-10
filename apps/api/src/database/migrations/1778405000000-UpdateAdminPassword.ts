import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminPassword1778405000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update password for admin@wellanalytics.com to Exhe.40241000
        await queryRunner.query(
            `UPDATE users SET password_hash = '$2a$12$cvIgc.SsLvuFybIfs8jstuJSbo9dfgPgJNluuaKEgcOwhbY2UaROK' WHERE email = 'admin@wellanalytics.com'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to revert for this specific task
    }
}
