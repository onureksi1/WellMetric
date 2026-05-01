import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CreditType } from './credit-type.entity';

@Entity('credit_balances')
@Unique(['consultant_id', 'credit_type_key'])
export class CreditBalance {
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

  @Column({ type: 'int', default: 0 })
  balance: number; // -1 for unlimited

  @Column({ type: 'int', default: 0 })
  used_this_month: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_reset_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
