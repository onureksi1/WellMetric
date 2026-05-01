import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DistributionCampaign } from './distribution-campaign.entity';

export enum DistributionLogStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  FAILED = 'failed',
}

@Entity('distribution_logs')
export class DistributionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id' })
  @Index()
  campaignId: string;

  @Column({ name: 'company_id' })
  @Index()
  companyId: string;

  @Column()
  email: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'survey_token_id', nullable: true })
  @Index()
  surveyTokenId: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: DistributionLogStatus,
    default: DistributionLogStatus.PENDING,
  })
  status: DistributionLogStatus;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  clicked_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ name: 'mail_provider_id', nullable: true })
  mail_provider_id: string;

  @Column({ name: 'bounce_reason', nullable: true })
  bounce_reason: string;

  @Column({ default: 0 })
  retry_count: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => DistributionCampaign, (campaign) => campaign.logs)
  @JoinColumn({ name: 'campaign_id' })
  campaign: DistributionCampaign;
}
