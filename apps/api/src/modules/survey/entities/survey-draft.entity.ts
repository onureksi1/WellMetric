import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('survey_drafts')
export class SurveyDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  created_by: string;

  @Column({ length: 300, nullable: true })
  title: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  draft_data: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'last_saved_at' })
  last_saved_at: Date;
}
