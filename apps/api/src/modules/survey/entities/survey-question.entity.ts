import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyQuestionOption } from './survey-question-option.entity';
import { SurveyQuestionRow } from './survey-question-row.entity';

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @ManyToOne(() => Survey, survey => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'varchar', length: 50 })
  dimension: string;

  @Column({ type: 'text' })
  question_text_tr: string;

  @Column({ type: 'text', nullable: true })
  question_text_en: string | null;

  @Column({ type: 'varchar', length: 50 })
  question_type: string;

  @Column({ type: 'boolean', default: false })
  is_reversed: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int' })
  order_index: number;

  // For number_input type
  @Column({ type: 'int', nullable: true })
  number_min: number | null;

  @Column({ type: 'int', nullable: true })
  number_max: number | null;

  @Column({ type: 'int', nullable: true })
  number_step: number | null;

  // For matrix type
  @Column({ type: 'varchar', length: 100, nullable: true })
  matrix_label_tr: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  matrix_label_en: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => SurveyQuestionOption, option => option.question, { cascade: true })
  options: SurveyQuestionOption[];

  @OneToMany(() => SurveyQuestionRow, row => row.question, { cascade: true })
  rows: SurveyQuestionRow[];
}
