import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';
import { ContentItem } from '../../content/entities/content-item.entity';
import { User } from '../../user/entities/user.entity';

@Entity('actions')
@Index('idx_actions_company', ['company_id', 'status'])
export class Action {
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

  @Column({ type: 'varchar', length: 30, nullable: true })
  dimension: string | null;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  content_item_id: string | null;

  @ManyToOne(() => ContentItem, { nullable: true })
  @JoinColumn({ name: 'content_item_id' })
  content_item: ContentItem;

  @Column({ type: 'varchar', length: 20, default: 'planned' })
  status: string;

  @Column({ type: 'date', nullable: true })
  due_date: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
