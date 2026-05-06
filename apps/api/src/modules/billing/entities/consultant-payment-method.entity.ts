import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('consultant_payment_methods')
@Unique(['consultant_id', 'provider'])
export class ConsultantPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_payment_methods_consultant')
  consultant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ type: 'varchar', length: 20 })
  provider: string; // 'stripe' | 'paytr'

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  // Stripe fields
  @Column({ type: 'varchar', length: 200, nullable: true })
  stripe_customer_id: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripe_payment_method_id: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  stripe_last4: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  stripe_brand: string | null;



  // Common fields
  @Column({ type: 'varchar', length: 2, nullable: true })
  expires_month: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  expires_year: string | null;

  @CreateDateColumn()
  created_at: Date;
}
