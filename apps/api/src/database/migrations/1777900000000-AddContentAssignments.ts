import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentAssignments1777900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Consultant'ın içerik atamalarını takip eder
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_assignments (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        consultant_id   UUID NOT NULL REFERENCES users(id),
        company_id      UUID NOT NULL REFERENCES companies(id),
        department_id   UUID REFERENCES departments(id),
        -- NULL = tüm firma, dolu = sadece o departman

        -- Gönderim durumu
        status          VARCHAR(20) DEFAULT 'draft',
        -- 'draft'   → atandı ama henüz gönderilmedi
        -- 'sent'    → HR'a mail gönderildi
        -- 'viewed'  → HR okudu (opsiyonel tracking)

        sent_at         TIMESTAMPTZ,
        sent_by         UUID REFERENCES users(id),  -- consultant user_id

        notes           TEXT,  -- consultant'ın HR'a notu

        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),

        -- Aynı içerik aynı firma+departmana iki kez atanamaz
        UNIQUE(content_item_id, company_id, department_id)
      );

      CREATE INDEX idx_content_assignments_consultant
        ON content_assignments(consultant_id, created_at DESC);

      CREATE INDEX idx_content_assignments_company
        ON content_assignments(company_id, status);

      -- content_items tablosuna is_global ekle
      -- consultant_id zaten entity'de var ama veritabanında kontrol edelim
      ALTER TABLE content_items
        ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS is_global     BOOLEAN DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS content_assignments`);
    await queryRunner.query(`ALTER TABLE content_items DROP COLUMN IF EXISTS is_global`);
    // consultant_id kalsın, belki başka yerde lazımdır
  }
}
