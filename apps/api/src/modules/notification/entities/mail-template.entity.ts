import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('mail_templates')
export class MailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  slug: string;

  @Column({ length: 300 })
  subject_tr: string;

  @Column({ length: 300, nullable: true })
  subject_en: string;

  @Column('text')
  body_tr: string;

  @Column('text', { nullable: true })
  body_en: string;

  @Column('jsonb', { default: [] })
  variables: string[];

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;
}
