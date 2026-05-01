import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';

@Entity('users')
@Index('idx_users_company', ['company_id'])
@Index('idx_users_company_role', ['company_id', 'role'])
@Index('idx_users_dept', ['department_id'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ type: 'text', nullable: true, select: false })
  password_hash: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  full_name: string | null;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  seniority: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  age_group: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'date', nullable: true })
  start_date: string | null;

  @Column({ type: 'varchar', length: 10, default: 'tr' })
  language: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
