import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Survey } from '../../survey/entities/survey.entity';

@Entity('survey_tokens')
export class SurveyToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  token: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid', nullable: true })
  assignment_id: string | null;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  full_name: string | null;

  @Column({ type: 'varchar', default: 'tr' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  due_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
