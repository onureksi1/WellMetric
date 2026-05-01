import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CreditType } from './credit-type.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  consultant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'varchar', length: 50 })
  credit_type_key: string;

  @ManyToOne(() => CreditType)
  @JoinColumn({ name: 'credit_type_key' })
  creditType: CreditType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  type: string; // 'purchase', 'usage', 'bonus', 'reset', 'refund'

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_id: string | null; // payment_id or AI task ID

  @CreateDateColumn()
  created_at: Date;
}
