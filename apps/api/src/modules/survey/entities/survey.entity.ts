import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';
import { SurveyAssignment } from './survey-assignment.entity';
import { User } from '../../user/entities/user.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  title_tr: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  title_en: string | null;

  @Column({ type: 'text', nullable: true })
  description_tr: string | null;

  @Column({ type: 'text', nullable: true })
  description_en: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: string; // global, company_specific, onboarding, pulse

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequency: string | null; // once, weekly, monthly, quarterly

  @Column({ type: 'boolean', default: true })
  is_anonymous: boolean;

  @Column({ type: 'int', default: 7 })
  throttle_days: number;

  @Column({ type: 'timestamptz', nullable: true })
  starts_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ends_at: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ name: 'is_pool_visible', default: true })
  isPoolVisible: boolean;

  @Column({ name: 'pool_added_at', type: 'timestamptz', nullable: true })
  poolAddedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => SurveyQuestion, question => question.survey, { cascade: true })
  questions: SurveyQuestion[];

  @OneToMany(() => SurveyAssignment, assignment => assignment.survey, { cascade: true })
  assignments: SurveyAssignment[];
}
