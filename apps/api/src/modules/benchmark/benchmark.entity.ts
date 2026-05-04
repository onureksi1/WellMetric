import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('industry_benchmark_scores')
export class IndustryBenchmarkScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  industry: string;

  @Column()
  region: string;       // 'global' | 'turkey'

  @Column()
  dimension: string;

  @Column('decimal', { precision: 5, scale: 2 })
  score: number;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_year', nullable: true })
  sourceYear: number;

  @Column({ name: 'is_seed', default: true })
  isSeed: boolean;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
