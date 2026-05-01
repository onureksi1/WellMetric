import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Survey } from './survey.entity';

@Entity('survey_assignments')
export class SurveyAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @ManyToOne(() => Survey, survey => survey.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  period: string | null; // e.g. 2026-Q1

  @Column({ type: 'timestamptz', nullable: true })
  due_at: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, completed, expired

  @CreateDateColumn({ type: 'timestamptz' })
  assigned_at: Date;

  @Column({ type: 'uuid', nullable: true })
  assigned_by: string | null;
}
