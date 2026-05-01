import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Survey } from '../../survey/entities/survey.entity';
import { DistributionLog } from './distribution-log.entity';

export enum CampaignTriggerType {
  CRON_AUTO = 'cron_auto',
  HR_MANUAL = 'hr_manual',
  HR_REMINDER = 'hr_reminder',
}

export enum CampaignStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
}

@Entity('distribution_campaigns')
export class DistributionCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'survey_id' })
  surveyId: string;

  @Column({ name: 'assignment_id', nullable: true })
  assignmentId: string;

  @Column({ nullable: true })
  period: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({
    type: 'enum',
    enum: CampaignTriggerType,
    default: CampaignTriggerType.HR_MANUAL,
  })
  trigger_type: CampaignTriggerType;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ default: 0 })
  total_recipients: number;

  @Column({ default: 0 })
  sent_count: number;

  @Column({ default: 0 })
  delivered_count: number;

  @Column({ default: 0 })
  opened_count: number;

  @Column({ default: 0 })
  clicked_count: number;

  @Column({ default: 0 })
  completed_count: number;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.PENDING,
  })
  status: CampaignStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Survey)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => DistributionLog, (log) => log.campaign)
  logs: DistributionLog[];
}
