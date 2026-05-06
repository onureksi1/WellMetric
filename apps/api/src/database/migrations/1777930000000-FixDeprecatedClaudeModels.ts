import { MigrationInterface, QueryRunner } from "typeorm";

// claude-3-haiku-20240307 ve diğer eski Claude 3 modelleri Anthropic tarafından kaldırıldı.
// Bu migration, platform_settings tablosundaki eski model isimlerini güncel karşılıklarıyla değiştirir.
const MODEL_REPLACEMENTS: Record<string, string> = {
  'claude-3-haiku-20240307':         'claude-haiku-4-5',
  'claude-3-haiku-20240307-v1:0':    'claude-haiku-4-5',
  'claude-3-5-haiku-20241022':       'claude-haiku-4-5',
  'claude-3-5-haiku':                'claude-haiku-4-5',
  'claude-3-opus-20240229':          'claude-opus-4-7',
  'claude-3-sonnet-20240229':        'claude-sonnet-4-6',
  'claude-3-5-sonnet-20240620':      'claude-sonnet-4-6',
  'claude-3-5-sonnet-20241022':      'claude-sonnet-4-6',
  'claude-3-5-sonnet':               'claude-sonnet-4-6',
  'claude-opus-4-5':                 'claude-opus-4-7',
  'claude-sonnet-4-5':               'claude-sonnet-4-6',
};

export class FixDeprecatedClaudeModels1777930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [oldModel, newModel] of Object.entries(MODEL_REPLACEMENTS)) {
      // ai_model_default sütununu güncelle
      await queryRunner.query(`
        UPDATE platform_settings
        SET ai_model_default = $1
        WHERE ai_model_default = $2
      `, [newModel, oldModel]);

      // ai_task_models JSONB içindeki tüm task'larda model alanını güncelle
      await queryRunner.query(`
        UPDATE platform_settings
        SET ai_task_models = (
          SELECT jsonb_object_agg(
            task_key,
            CASE
              WHEN task_value->>'model' = $2
              THEN jsonb_set(task_value, '{model}', to_jsonb($1::text))
              ELSE task_value
            END
          )
          FROM jsonb_each(ai_task_models) AS t(task_key, task_value)
        )
        WHERE ai_task_models::text LIKE $3
      `, [newModel, oldModel, `%${oldModel}%`]);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Model isimleri geri alınamaz (eski modeller artık mevcut değil)
  }
}
