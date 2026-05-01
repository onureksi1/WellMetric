import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credit_types')
export class CreditType {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  label_tr: string;

  @Column({ type: 'varchar', length: 100 })
  label_en: string;

  @Column({ type: 'text', nullable: true })
  description_tr: string | null;

  @Column({ type: 'text', nullable: true })
  description_en: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Brain' })
  icon: string;

  @Column({ type: 'varchar', length: 20, default: '#6C3A8E' })
  color: string;

  @Column({ type: 'int', default: 1 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
