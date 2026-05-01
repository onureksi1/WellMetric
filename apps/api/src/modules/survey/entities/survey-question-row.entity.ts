import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_question_rows')
export class SurveyQuestionRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @ManyToOne(() => SurveyQuestion, question => question.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @Column({ type: 'varchar', length: 300 })
  label_tr: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  label_en: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dimension: string | null;

  @Column({ type: 'boolean', default: false })
  is_reversed: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'int' })
  order_index: number;
}
