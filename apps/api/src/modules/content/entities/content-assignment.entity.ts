import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentItem } from './content-item.entity';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';
import { User } from '../../user/entities/user.entity';

@Entity('content_assignments')
export class ContentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_item_id' })
  content_item_id: string;

  @ManyToOne(() => ContentItem)
  @JoinColumn({ name: 'content_item_id' })
  content_item: ContentItem;

  @Column({ name: 'consultant_id' })
  consultant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ name: 'company_id' })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'department_id', nullable: true })
  department_id: string | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date | null;

  @Column({ name: 'sent_by', type: 'uuid', nullable: true })
  sent_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sent_by' })
  sent_by_user: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  notified_at: Date | null;

  @Column({ name: 'notified_by', type: 'uuid', nullable: true })
  notified_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'notified_by' })
  notified_by_user: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
