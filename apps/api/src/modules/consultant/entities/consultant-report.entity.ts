import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('consultant_reports')
export class ConsultantReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  period: string;

  @Column('uuid', { array: true, name: 'ai_insight_ids', default: [] })
  aiInsightIds: string[];

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamptz', name: 'notified_at', nullable: true })
  notifiedAt: Date;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
