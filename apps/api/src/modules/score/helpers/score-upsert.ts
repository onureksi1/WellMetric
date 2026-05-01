import { QueryRunner } from 'typeorm';
import { WellbeingScore } from '../entities/wellbeing-score.entity';

export interface UpsertScoreParams {
  company_id: string | null;
  department_id: string | null;
  survey_id: string | null;
  period: string;
  dimension: string;
  segment_type: string | null;
  segment_value: string | null;
  score: number | null;
  respondent_count: number;
}

export async function upsertScore(
  queryRunner: QueryRunner,
  params: UpsertScoreParams,
) {
  const {
    company_id,
    department_id,
    survey_id,
    period,
    dimension,
    segment_type,
    segment_value,
    score,
    respondent_count,
  } = params;

  await queryRunner.query(
    `
    INSERT INTO wellbeing_scores (
      company_id, department_id, survey_id, period, dimension,
      segment_type, segment_value, score, respondent_count, calculated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (
      company_id, department_id, survey_id, period, dimension,
      segment_type, segment_value
    )
    DO UPDATE SET
      score = EXCLUDED.score,
      respondent_count = EXCLUDED.respondent_count,
      calculated_at = NOW()
    `,
    [
      company_id,
      department_id,
      survey_id,
      period,
      dimension,
      segment_type,
      segment_value,
      score,
      respondent_count,
    ],
  );
}
