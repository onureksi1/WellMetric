import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConsultantReports1777910000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS consultant_reports (
                id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultant_id    UUID NOT NULL REFERENCES users(id),
                company_id       UUID NOT NULL REFERENCES companies(id),

                -- Rapor içeriği
                title            VARCHAR(300) NOT NULL,
                summary          TEXT,         -- kısa özet (HR'ın liste görünümünde göreceği)
                content          TEXT NOT NULL, -- markdown formatında tam rapor içeriği
                period           VARCHAR(7),   -- '2026-05' — hangi dönem için

                -- Bağlantılı AI insight'lar (opsiyonel)
                ai_insight_ids   UUID[] DEFAULT '{}',

                -- Durum
                status           VARCHAR(20) DEFAULT 'draft',
                -- 'draft'     → sadece consultant görür
                -- 'published' → HR görür

                published_at     TIMESTAMPTZ,
                notified_at      TIMESTAMPTZ, -- HR'a mail gönderildi mi

                -- Metadata
                tags             TEXT[],       -- ['fiziksel','zihinsel'] vb.
                is_pinned        BOOLEAN DEFAULT false, -- HR listesinde üstte

                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_consultant_reports_consultant
                ON consultant_reports(consultant_id, created_at DESC);

            CREATE INDEX idx_consultant_reports_company
                ON consultant_reports(company_id, status, published_at DESC);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS consultant_reports;`);
    }
}
