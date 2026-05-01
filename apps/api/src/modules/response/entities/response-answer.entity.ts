import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyResponse } from './survey-response.entity';

@Entity('response_answers')
export class ResponseAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  response_id: string;

  @ManyToOne(() => SurveyResponse, response => response.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @Column({ type: 'uuid' })
  question_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dimension: string | null;

  @Column({ type: 'int', nullable: true })
  answer_value: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  answer_number: number | null;

  @Column({ type: 'text', nullable: true })
  answer_text: string | null;

  @Column({ type: 'uuid', nullable: true })
  answer_option_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  answer_row_id: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null;
}
