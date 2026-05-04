import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ResponseAnswer } from './response-answer.entity';
import { ResponseAnswerSelection } from './response-answer-selection.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignment_id: string | null;

  @Column({ type: 'varchar', length: 7 })
  period: string;

  @CreateDateColumn({ type: 'timestamptz' })
  submitted_at: Date;

  @Column({ type: 'int', nullable: true })
  tenure_months: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  seniority: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  age_group: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'boolean', default: true })
  is_anonymous: boolean;

  @OneToMany(() => ResponseAnswer, answer => answer.response, { cascade: true })
  answers: ResponseAnswer[];

  @OneToMany(() => ResponseAnswerSelection, selection => selection.response, { cascade: true })
  selections: ResponseAnswerSelection[];
}
