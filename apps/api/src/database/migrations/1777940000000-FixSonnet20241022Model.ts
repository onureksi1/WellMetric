import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSonnet20241022Model1777940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const deprecated = 'claude-3-5-sonnet-20241022';
    const replacement = 'claude-sonnet-4-6';

    await queryRunner.query(`
      UPDATE platform_settings
      SET ai_model_default = $1
      WHERE ai_model_default = $2
    `, [replacement, deprecated]);

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
    `, [replacement, deprecated, `%${deprecated}%`]);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
