import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainingPlan } from './training-plan.entity';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';
import { ContentItem } from '../../content/entities/content-item.entity';
import { User } from '../../user/entities/user.entity';

@Entity('training_events')
export class TrainingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => TrainingPlan, (plan) => plan.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: TrainingPlan;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'event_type', type: 'varchar', length: 30, default: 'session' })
  eventType: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ name: 'content_item_id', type: 'uuid', nullable: true })
  contentItemId: string;

  @ManyToOne(() => ContentItem, { nullable: true })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl: string;

  @Column({ name: 'external_url_label', type: 'varchar', length: 200, nullable: true })
  externalUrlLabel: string;

  @Column({ type: 'varchar', length: 20, default: 'upcoming' })
  status: string;

  @Column({ name: 'hr_notes', type: 'text', nullable: true })
  hrNotes: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completedByUser: User;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
