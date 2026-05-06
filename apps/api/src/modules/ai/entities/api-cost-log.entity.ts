import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Company } from '../../company/entities/company.entity';
import { AiInsight } from './ai-insight.entity';
import { CreditTransaction } from '../../billing/entities/credit-transaction.entity';

@Entity('api_cost_logs')
export class ApiCostLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  consultant_id: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  company_id: string | null;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 50 })
  task_type: string;

  @Column({ type: 'varchar', length: 30 })
  provider: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int', default: 0 })
  input_tokens: number;

  @Column({ type: 'int', default: 0 })
  output_tokens: number;

  @Column({ type: 'int', generatedType: 'STORED', asExpression: 'input_tokens + output_tokens' })
  total_tokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  cost_usd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  revenue_try: number | null;

  @Column({ type: 'uuid', nullable: true })
  ai_insight_id: string | null;

  @ManyToOne(() => AiInsight)
  @JoinColumn({ name: 'ai_insight_id' })
  ai_insight: AiInsight;

  @Column({ type: 'uuid', nullable: true })
  credit_tx_id: string | null;

  @ManyToOne(() => CreditTransaction)
  @JoinColumn({ name: 'credit_tx_id' })
  credit_tx: CreditTransaction;

  @Column({ type: 'int', nullable: true })
  duration_ms: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  created_at: Date;
}
