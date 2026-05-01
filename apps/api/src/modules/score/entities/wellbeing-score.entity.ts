import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('wellbeing_scores')
@Unique(['company_id', 'period', 'segment_type', 'segment_value', 'dimension'])
export class WellbeingScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'varchar', length: 50 })
  period: string; // e.g. 2026-Q1

  @Column({ type: 'varchar', length: 50, nullable: true })
  segment_type: string | null; // e.g. 'department', 'location', 'seniority', null for overall

  @Column({ type: 'varchar', length: 100, nullable: true })
  segment_value: string | null; // e.g. department_id, 'Istanbul', 'Junior', null for overall

  @Column({ type: 'varchar', length: 50 })
  dimension: string; // e.g. 'mental', 'physical', 'social', 'overall'

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'int', default: 0 })
  response_count: number;

  @CreateDateColumn({ name: 'calculated_at', type: 'timestamptz' })
  calculated_at: Date;
}
