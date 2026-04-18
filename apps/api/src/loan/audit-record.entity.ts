import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_records' })
@Index(['applicationId'])
export class AuditRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'varchar', length: 128, unique: true })
  eventId!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 128 })
  applicationId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 128 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
