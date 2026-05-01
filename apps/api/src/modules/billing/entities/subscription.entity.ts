import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ProductPackage } from './product-package.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  consultant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'varchar', length: 100 })
  package_key: string;

  @ManyToOne(() => ProductPackage)
  @JoinColumn({ name: 'package_key' })
  package: ProductPackage;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending', 'active', 'past_due', 'canceled', 'expired'

  @Column({ type: 'varchar', length: 20 })
  interval: string; // 'monthly', 'yearly'

  @Column({ type: 'timestamp' })
  current_period_start: Date;

  @Column({ type: 'timestamp' })
  current_period_end: Date;

  @Column({ type: 'boolean', default: false })
  cancel_at_period_end: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_subscription_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
