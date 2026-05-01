import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyResponse } from './survey-response.entity';

@Entity('response_answer_selections')
export class ResponseAnswerSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  response_id: string;

  @ManyToOne(() => SurveyResponse, response => response.selections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @Column({ type: 'uuid' })
  question_id: string;

  @Column({ type: 'uuid' })
  option_id: string;

  @Column({ type: 'int', nullable: true })
  rank_order: number | null;
}
