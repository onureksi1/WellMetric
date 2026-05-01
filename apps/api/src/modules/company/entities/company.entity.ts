import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface CompanySettings {
  employee_accounts: boolean;
  anonymity_threshold: number;
  benchmark_visible: boolean;
  default_language: string;
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  size_band: string | null;

  @Column({ type: 'varchar', length: 20, default: 'starter' })
  plan: string;

  @Column({ type: 'timestamptz', nullable: true })
  plan_expires_at: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contact_email: string | null;

  @Column({ type: 'text', nullable: true })
  logo_url: string | null;

  @Column({
    type: 'jsonb',
    default: () =>
      `'{"employee_accounts":false,"anonymity_threshold":5,"benchmark_visible":true,"default_language":"tr"}'`,
  })
  settings: CompanySettings;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  consultant_id: string | null;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;
}
