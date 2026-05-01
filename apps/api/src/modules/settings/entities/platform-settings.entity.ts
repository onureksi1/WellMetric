import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface AiTaskModels {
  open_text_summary: { provider: string; model: string };
  risk_alert: { provider: string; model: string };
  action_suggestion: { provider: string; model: string };
  trend_analysis: { provider: string; model: string };
  hr_chat: { provider: string; model: string };
  admin_anomaly: { provider: string; model: string };
  dimension_weights: Record<string, number>;
}


@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // AI settings
  @Column({ type: 'varchar', length: 30, default: 'anthropic' })
  ai_provider_default: string;

  @Column({ type: 'varchar', length: 100, default: 'claude-opus-4-5' })
  ai_model_default: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  ai_task_models: AiTaskModels;

  @Column({ type: 'int', default: 2000 })
  ai_max_tokens: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0.3 })
  ai_temperature: number;

  @Column({ type: 'boolean', default: true })
  ai_enabled: boolean;

  // Mail settings
  @Column({ type: 'varchar', length: 30, default: 'resend' })
  mail_provider: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  mail_from_address: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  mail_from_name: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  mail_config: any;

  // Storage settings
  @Column({ type: 'varchar', length: 20, default: 'cloudflare_r2' })
  storage_provider: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  storage_config: any;

  // General settings
  @Column({ type: 'varchar', length: 200, default: 'Wellbeing Platformu' })
  platform_name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  platform_url: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  admin_email: string | null;

  @Column({ type: 'jsonb', default: () => "'[\"tr\",\"en\"]'" })
  supported_languages: string[];

  @Column({ type: 'varchar', length: 10, default: 'tr' })
  default_language: string;

  @Column({ type: 'int', default: 5 })
  anonymity_threshold: number;

  @Column({ type: 'int', default: 45 })
  score_alert_threshold: number;

  @Column({ type: 'jsonb', default: () => "'{}'" , select: false })
  api_keys: Record<string, string>;
  
  @Column({ type: 'jsonb', default: () => "'{}'" })
  consultant_packages: any;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;
}
