import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('consultant_plans')
export class ConsultantPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  consultant_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'varchar', length: 20, default: 'starter' })
  plan: string;

  @Column({ type: 'int', default: 5 })
  max_companies: number;

  @Column({ type: 'int', default: 100 })
  max_employees: number;

  @Column({ type: 'boolean', default: true })
  ai_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  white_label: boolean;

  @Column({ name: 'brand_name', length: 200, nullable: true })
  brandName: string;

  @Column({ name: 'brand_logo_url', nullable: true })
  brandLogoUrl: string;

  @Column({ name: 'brand_color', length: 7, nullable: true })
  brandColor: string;

  @Column({ name: 'brand_favicon_url', nullable: true })
  brandFaviconUrl: string;

  @Column({ name: 'custom_domain', length: 200, nullable: true })
  customDomain: string | null;

  @Column({ name: 'custom_domain_verified', default: false })
  customDomainVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  valid_until: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
