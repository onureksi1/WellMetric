import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('audit_logs')
@Index('idx_audit_user', ['user_id', 'created_at'])
@Index('idx_audit_company', ['company_id', 'created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target_type: string | null;

  @Column({ type: 'uuid', nullable: true })
  target_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any> | null;

  @Column({ type: 'inet', nullable: true })
  ip_address: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
