import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('survey_throttle')
export class SurveyThrottle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  last_submitted_at: Date;
}
