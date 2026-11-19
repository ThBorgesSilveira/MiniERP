import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { inList } from '../database/column-helpers';

export const AUDIT_ACTIONS = ['update', 'delete'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// Guarda a versão anterior do registro. Um trigger grava o log.
@Entity('audit_logs')
@Index(['tableName', 'recordId'])
@Index(['changedAt'])
@Check(inList('action', AUDIT_ACTIONS))
export class AuditLog {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'varchar' })
  tableName: string;

  @Column({ type: 'integer' })
  recordId: number;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  changedAt: Date;

  @Column({ type: 'integer', nullable: true })
  @ForeignKey('User')
  changedBy: number | null;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;
}
