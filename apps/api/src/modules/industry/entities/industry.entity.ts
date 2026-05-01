import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('industries')
export class Industry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string;

  @Column({ length: 200 })
  label_tr: string;

  @Column({ length: 200, nullable: true })
  label_en: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
