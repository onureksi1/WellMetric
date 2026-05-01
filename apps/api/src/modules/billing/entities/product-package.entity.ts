import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_packages')
export class ProductPackage {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // 'subscription' | 'credit'

  @Column({ type: 'varchar', length: 200 })
  label_tr: string;

  @Column({ type: 'varchar', length: 200 })
  label_en: string;

  @Column({ type: 'text', nullable: true })
  description_tr: string | null;

  @Column({ type: 'text', nullable: true })
  description_en: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_monthly: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_yearly: number | null;

  @Column({ type: 'varchar', length: 10, default: 'TRY' })
  currency: string;

  @Column({ type: 'jsonb', default: {} })
  credits: Record<string, number>;

  @Column({ type: 'int', nullable: true })
  max_companies: number | null;

  @Column({ type: 'int', nullable: true })
  max_employees: number | null;

  @Column({ type: 'boolean', default: false })
  ai_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  white_label: boolean;

  @Column({ type: 'int', default: 1 })
  sort_order: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  is_visible: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
