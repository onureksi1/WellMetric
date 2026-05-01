import { MigrationInterface, QueryRunner } from "typeorm";

export class DemoRequestsSurveyDrafts1714318000000 implements MigrationInterface {
    name = 'DemoRequestsSurveyDrafts1714318000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // survey_drafts
        await queryRunner.query(`
            CREATE TABLE "survey_drafts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_by" uuid NOT NULL,
                "draft_data" jsonb NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_survey_drafts_created_by" UNIQUE ("created_by"),
                CONSTRAINT "PK_survey_drafts" PRIMARY KEY ("id")
            )
        `);

        // demo_requests
        await queryRunner.query(`
            CREATE TYPE "public"."demo_requests_company_size_enum" AS ENUM('1-50', '51-250', '251-1000', '1000+')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."demo_requests_status_enum" AS ENUM('pending', 'contacted', 'demo_done', 'converted', 'rejected')
        `);
        await queryRunner.query(`
            CREATE TABLE "demo_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "company_name" character varying(255) NOT NULL,
                "company_size" "public"."demo_requests_company_size_enum",
                "industry" character varying(255),
                "phone" character varying(50),
                "message" text,
                "status" "public"."demo_requests_status_enum" NOT NULL DEFAULT 'pending',
                "notes" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_demo_requests" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "demo_requests"`);
        await queryRunner.query(`DROP TYPE "public"."demo_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."demo_requests_company_size_enum"`);
        await queryRunner.query(`DROP TABLE "survey_drafts"`);
    }
}
