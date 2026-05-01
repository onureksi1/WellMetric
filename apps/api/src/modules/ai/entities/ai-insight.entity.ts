import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';
import { Survey } from '../../survey/entities/survey.entity';

@Entity('ai_insights')
@Index('idx_insights_company', ['company_id', 'period'])
@Index('idx_insights_type', ['company_id', 'insight_type', 'period'])
export class AiInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'uuid', nullable: true })
  survey_id: string | null;

  @ManyToOne(() => Survey, { nullable: true })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'varchar', length: 7, nullable: true })
  period: string | null;

  @Column({ type: 'varchar', length: 30 })
  insight_type: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'generated_at' })
  generated_at: Date;
}
