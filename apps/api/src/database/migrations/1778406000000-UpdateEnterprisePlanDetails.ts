import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEnterprisePlanDetails1778406000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Update Enterprise Package definition
        await queryRunner.query(`
            UPDATE product_packages 
            SET 
                price_monthly = 599.00,
                max_companies = NULL,
                white_label = true,
                description_tr = 'Sınırsız firma, sınırsız AI kredisi, white-label.',
                credits = '{"ai_credit": 3000, "mail_credit": 25000}'::jsonb
            WHERE key = 'enterprise'
        `);

        // 2. Update Growth and Starter Package definitions for consistency
        await queryRunner.query(`
            UPDATE product_packages SET max_companies = 10 WHERE key = 'growth';
            UPDATE product_packages SET max_companies = 3 WHERE key = 'starter';
        `);

        // 3. Sync existing consultant plans with new package limits
        await queryRunner.query(`
            UPDATE consultant_plans cp 
            SET 
                max_companies = pp.max_companies,
                ai_enabled = pp.ai_enabled,
                white_label = pp.white_label
            FROM product_packages pp 
            WHERE cp.plan = pp.key
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No specific rollback needed for this data sync
    }
}
