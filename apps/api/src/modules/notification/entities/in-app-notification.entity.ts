import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn 
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('in_app_notifications')
export class InAppNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  type: string;

  @Column({ name: 'title_tr' })
  titleTr: string;

  @Column({ name: 'title_en' })
  titleEn: string;

  @Column({ name: 'body_tr', nullable: true })
  bodyTr: string;

  @Column({ name: 'body_en', nullable: true })
  bodyEn: string;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
