import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('consultant_plans')
export class ConsultantPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  consultant_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'varchar', length: 20, default: 'starter' })
  plan: string;

  @Column({ type: 'int', default: 5 })
  max_companies: number;

  @Column({ type: 'int', default: 100 })
  max_employees: number;

  @Column({ type: 'boolean', default: true })
  ai_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  white_label: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  custom_domain: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  valid_until: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
