import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TrainingEvent } from './training-event.entity';
import { Company } from '../../company/entities/company.entity';
import { Department } from '../../department/entities/department.entity';
import { User } from '../../user/entities/user.entity';

@Entity('training_notifications')
export class TrainingNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => TrainingEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: TrainingEvent;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'sent_by' })
  sentBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sent_by' })
  sentByUser: User;

  @Column({ name: 'recipient_count', default: 0 })
  recipientCount: number;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;

  @Column({ type: 'varchar', length: 300, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
