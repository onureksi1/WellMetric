import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('wellbeing_scores')
@Unique(['company_id', 'survey_id', 'period', 'dimension', 'segment_type', 'segment_value', 'department_id'])
export class WellbeingScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid', nullable: true })
  survey_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  period: string; // e.g. 2024-05

  @Column({ type: 'varchar', length: 50, nullable: true })
  segment_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  segment_value: string | null;

  @Column({ type: 'varchar', length: 50 })
  dimension: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'int', default: 0 })
  response_count: number;

  @CreateDateColumn({ name: 'calculated_at', type: 'timestamptz' })
  calculated_at: Date;
}
