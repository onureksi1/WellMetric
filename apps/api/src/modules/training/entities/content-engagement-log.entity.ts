import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ContentItem } from '../../content/entities/content-item.entity';
import { TrainingEvent } from './training-event.entity';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';

@Entity('content_engagement_logs')
export class ContentEngagementLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @ManyToOne(() => ContentItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem;

  @Column({ name: 'training_event_id', nullable: true })
  trainingEventId: string;

  @ManyToOne(() => TrainingEvent, { nullable: true })
  @JoinColumn({ name: 'training_event_id' })
  trainingEvent: TrainingEvent;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  action: string;
  // 'view' | 'click' | 'notify'

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
