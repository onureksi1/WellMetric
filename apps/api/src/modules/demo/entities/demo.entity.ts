import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('demo_requests')
export class DemoRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  full_name: string;

  @Column({ length: 200 })
  email: string;

  @Column({ length: 200 })
  company_name: string;

  @Column({ length: 20, nullable: true })
  company_size: string | null;

  @Column({ length: 100, nullable: true })
  industry: string | null;

  @Column({ length: 50, nullable: true })
  phone: string | null;

  @Column({ length: 50, nullable: true })
  user_type: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assigned_to_user: User | null;
}
