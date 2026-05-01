import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('content_items')
@Index('idx_content_dimension', ['dimension', 'score_threshold'])
export class ContentItem {
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

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  dimension: string | null;

  @Column({ type: 'text', nullable: true })
  url_tr: string | null;

  @Column({ type: 'text', nullable: true })
  url_en: string | null;

  @Column({ type: 'int', nullable: true })
  score_threshold: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  consultant_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
