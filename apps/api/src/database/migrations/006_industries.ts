import { MigrationInterface, QueryRunner } from "typeorm";

export class Industries1714316000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE industries (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug        VARCHAR(100) UNIQUE NOT NULL,
                label_tr    VARCHAR(200) NOT NULL,
                label_en    VARCHAR(200),
                is_active   BOOLEAN DEFAULT true,
                is_default  BOOLEAN DEFAULT false,
                order_index INTEGER DEFAULT 0,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_industries_slug ON industries(slug);
            CREATE INDEX idx_industries_order ON industries(order_index);

            INSERT INTO industries 
            (slug, label_tr, label_en, is_default, order_index)
            VALUES
            ('technology',    'Teknoloji',              'Technology',          true, 1),
            ('finance',       'Finans & Bankacılık',    'Finance & Banking',   true, 2),
            ('healthcare',    'Sağlık',                 'Healthcare',          true, 3),
            ('retail',        'Perakende',              'Retail',              true, 4),
            ('manufacturing', 'Üretim & Sanayi',        'Manufacturing',       true, 5),
            ('education',     'Eğitim',                 'Education',           true, 6),
            ('logistics',     'Lojistik & Taşımacılık', 'Logistics',           true, 7),
            ('energy',        'Enerji',                 'Energy',              true, 8),
            ('construction',  'İnşaat & Gayrimenkul',   'Construction',        true, 9),
            ('media',         'Medya & İletişim',       'Media',               true, 10),
            ('tourism',       'Turizm & Otelcilik',     'Tourism',             true, 11),
            ('food_beverage', 'Gıda & İçecek',          'Food & Beverage',     true, 12),
            ('automotive',    'Otomotiv',               'Automotive',          true, 13),
            ('telecom',       'Telekomünikasyon',        'Telecommunications',  true, 14),
            ('insurance',     'Sigorta',                'Insurance',           true, 15),
            ('consulting',    'Danışmanlık',            'Consulting',          true, 16),
            ('public_sector', 'Kamu Sektörü',           'Public Sector',       true, 17),
            ('ngo',           'STK & Sivil Toplum',     'NGO & Civil Society', true, 18),
            ('other',         'Diğer',                  'Other',               true, 19);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE industries');
    }
}
