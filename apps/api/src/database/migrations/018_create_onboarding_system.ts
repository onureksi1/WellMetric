import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnboardingSystem1746600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create onboarding_assignments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS onboarding_assignments (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
        user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
        survey_token_id UUID REFERENCES survey_tokens(id) ON DELETE SET NULL,
        wave_number     INT NOT NULL,
        scheduled_at    TIMESTAMPTZ NOT NULL,
        sent_at         TIMESTAMPTZ,
        completed_at    TIMESTAMPTZ,
        status          VARCHAR(20) DEFAULT 'pending',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, wave_number)
      );
    `);

    // 2. Seed onboarding surveys (Wave 1, 2, 3)
    // Wave 1: First Day
    const wave1Id = '00000000-0000-0000-0000-0000000000a1';
    await queryRunner.query(`
      INSERT INTO surveys (id, title_tr, title_en, type, is_anonymous, throttle_days, is_active)
      VALUES ('${wave1Id}', 'Hoş Geldiniz — 1. Gün Deneyimi', 'Welcome — Day 1 Experience', 'onboarding', true, 0, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Wave 2: 30th Day
    const wave2Id = '00000000-0000-0000-0000-0000000000a2';
    await queryRunner.query(`
      INSERT INTO surveys (id, title_tr, title_en, type, is_anonymous, throttle_days, is_active)
      VALUES ('${wave2Id}', 'İlk Ayınız Nasıl Geçti? — 30. Gün', 'How Was Your First Month? — Day 30', 'onboarding', true, 0, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Wave 3: 90th Day
    const wave3Id = '00000000-0000-0000-0000-0000000000a3';
    await queryRunner.query(`
      INSERT INTO surveys (id, title_tr, title_en, type, is_anonymous, throttle_days, is_active)
      VALUES ('${wave3Id}', 'Adaptasyon Süreci Değerlendirmesi — 90. Gün', 'Adaptation Process Evaluation — Day 90', 'onboarding', true, 0, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Seed Questions for Wave 1
    await queryRunner.query(`
      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave1Id}', 'İlk gününüzde ihtiyacınız olan tüm ekipmanlar hazır mıydı?', 'Was all the equipment you needed ready on your first day?', 'yes_no', 1, 'physical'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave1Id}' AND question_text_tr = 'İlk gününüzde ihtiyacınız olan tüm ekipmanlar hazır mıydı?');
      
      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave1Id}', 'Ekibinizle tanışma süreci nasıl geçti?', 'How was the process of meeting your team?', 'likert5', 2, 'social'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave1Id}' AND question_text_tr = 'Ekibinizle tanışma süreci nasıl geçti?');

      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave1Id}', 'İlk gün deneyiminizi iyileştirmek için ne yapabilirdik?', 'What could we have done to improve your first day experience?', 'open_text', 3, 'mental'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave1Id}' AND question_text_tr = 'İlk gün deneyiminizi iyileştirmek için ne yapabilirdik?');
    `);

    // 4. Seed Questions for Wave 2
    await queryRunner.query(`
      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave2Id}', 'İş sorumluluklarınız size net bir şekilde aktarıldı mı?', 'Were your job responsibilities clearly communicated to you?', 'likert5', 1, 'mental'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave2Id}' AND question_text_tr = 'İş sorumluluklarınız size net bir şekilde aktarıldı mı?');

      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave2Id}', 'Şirket kültürüne uyum sağladığınızı hissediyor musunuz?', 'Do you feel that you have adapted to the company culture?', 'likert5', 2, 'social'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave2Id}' AND question_text_tr = 'Şirket kültürüne uyum sağladığınızı hissediyor musunuz?');

      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave2Id}', 'Şu ana kadar yaşadığınız en büyük zorluk nedir?', 'What is the biggest challenge you have experienced so far?', 'open_text', 3, 'mental'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave2Id}' AND question_text_tr = 'Şu ana kadar yaşadığınız en büyük zorluk nedir?');
    `);

    // 5. Seed Questions for Wave 3
    await queryRunner.query(`
      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave3Id}', 'Rolünüzde başarılı olmak için yeterli destek alıyor musunuz?', 'Are you receiving enough support to succeed in your role?', 'likert5', 1, 'mental'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave3Id}' AND question_text_tr = 'Rolünüzde başarılı olmak için yeterli destek alıyor musunuz?');

      INSERT INTO survey_questions (survey_id, question_text_tr, question_text_en, question_type, order_index, dimension)
      SELECT '${wave3Id}', 'Gelecekte bu şirkette kendinizi nerede görüyorsunuz?', 'Where do you see yourself in this company in the future?', 'open_text', 2, 'mental'
      WHERE NOT EXISTS (SELECT 1 FROM survey_questions WHERE survey_id = '${wave3Id}' AND question_text_tr = 'Gelecekte bu şirkette kendinizi nerede görüyorsunuz?');
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE onboarding_assignments`);
    await queryRunner.query(`DELETE FROM surveys WHERE type = 'onboarding'`);
  }
}
