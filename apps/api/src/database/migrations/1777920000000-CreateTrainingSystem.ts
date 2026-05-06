import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTrainingSystem1777920000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Eğitim Planı (consultant oluşturur, firmaya özel)
            CREATE TABLE IF NOT EXISTS training_plans (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultant_id   UUID NOT NULL REFERENCES users(id),
                company_id       UUID NOT NULL REFERENCES companies(id),
                title           VARCHAR(300) NOT NULL,
                description     TEXT,
                status          VARCHAR(20) DEFAULT 'draft',
                -- 'draft' | 'published' | 'completed' | 'cancelled'
                starts_at       DATE,
                ends_at         DATE,
                published_at    TIMESTAMPTZ,
                created_at      TIMESTAMPTZ DEFAULT NOW(),
                updated_at      TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_training_plans_consultant
                ON training_plans(consultant_id, created_at DESC);
            CREATE INDEX idx_training_plans_company
                ON training_plans(company_id, status);

            -- Etkinlikler (plan içindeki tek tek adımlar)
            CREATE TABLE IF NOT EXISTS training_events (
                id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                plan_id          UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
                company_id       UUID NOT NULL REFERENCES companies(id),
                department_id    UUID REFERENCES departments(id),
                -- NULL = tüm firma

                -- Etkinlik bilgileri
                title            VARCHAR(300) NOT NULL,
                description      TEXT,         -- içerik özeti / ne öğrenilecek
                event_type       VARCHAR(30) DEFAULT 'session',
                -- 'session'  → eğitim oturumu
                -- 'webinar'  → online webinar
                -- 'workshop' → atölye
                -- 'reading'  → okuma görevi
                -- 'task'     → yapılacak görev

                -- Tarih & saat
                scheduled_at     TIMESTAMPTZ NOT NULL,  -- tam tarih + saat
                duration_minutes INT DEFAULT 60,         -- kaç dakika sürecek

                -- Bağlı içerik (opsiyonel — content_items tablosundan)
                content_item_id  UUID REFERENCES content_items(id),

                -- Harici link (content_item yoksa)
                external_url     TEXT,
                external_url_label VARCHAR(200),  -- "Zoom Linki", "Materyal" vb.

                -- Durum
                status           VARCHAR(20) DEFAULT 'upcoming',
                -- 'upcoming'   → henüz olmadı
                -- 'completed'  → HR tamamlandı işaretledi
                -- 'cancelled'  → iptal edildi
                -- 'postponed'  → ertelendi

                -- HR geri bildirimi
                hr_notes         TEXT,
                completed_at     TIMESTAMPTZ,
                completed_by     UUID REFERENCES users(id),  -- HR user_id

                sort_order       INT DEFAULT 0,
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_training_events_plan
                ON training_events(plan_id, scheduled_at ASC);
            CREATE INDEX idx_training_events_company
                ON training_events(company_id, scheduled_at ASC);
            CREATE INDEX idx_training_events_upcoming
                ON training_events(scheduled_at, status)
                WHERE status = 'upcoming';

            -- Bildirim mail geçmişi (HR kim, ne zaman, kime gönderdi)
            CREATE TABLE IF NOT EXISTS training_notifications (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id        UUID NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
                company_id      UUID NOT NULL REFERENCES companies(id),
                department_id   UUID REFERENCES departments(id),
                sent_by         UUID REFERENCES users(id),   -- HR user_id
                recipient_count INT DEFAULT 0,
                sent_at         TIMESTAMPTZ DEFAULT NOW(),
                subject         VARCHAR(300),
                notes           TEXT  -- HR'ın eklediği özel not
            );

            -- İçerik etkileşim izleme
            -- content_items tıklanma/açılma verisi
            CREATE TABLE IF NOT EXISTS content_engagement_logs (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
                training_event_id UUID REFERENCES training_events(id),
                company_id      UUID REFERENCES companies(id),
                -- Kim tıkladı (HR admin)
                user_id         UUID REFERENCES users(id),
                action          VARCHAR(20) NOT NULL,
                -- 'view'   → içerik sayfası açıldı
                -- 'click'  → harici link tıklandı
                -- 'notify' → bildirim maili gönderildi
                user_agent      TEXT,
                ip_address      INET,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_engagement_content
                ON content_engagement_logs(content_item_id, created_at DESC);
            CREATE INDEX idx_engagement_event
                ON content_engagement_logs(training_event_id, created_at DESC);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS content_engagement_logs;`);
        await queryRunner.query(`DROP TABLE IF EXISTS training_notifications;`);
        await queryRunner.query(`DROP TABLE IF EXISTS training_events;`);
        await queryRunner.query(`DROP TABLE IF EXISTS training_plans;`);
    }
}
