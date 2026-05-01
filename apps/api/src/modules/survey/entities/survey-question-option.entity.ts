import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_question_options')
export class SurveyQuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @ManyToOne(() => SurveyQuestion, question => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @Column({ type: 'varchar', length: 300 })
  label_tr: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  label_en: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  value: number;

  @Column({ type: 'int' })
  order_index: number;
}
