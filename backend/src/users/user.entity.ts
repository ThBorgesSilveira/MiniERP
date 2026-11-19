import { Column, Entity, Index } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';

@Entity('users')
@Index(['login'], { unique: true, where: '"deleted_at" IS NULL' })
export class User extends FullAuditEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'citext' })
  login: string;

  @Column({ type: 'varchar', select: false })
  passwordHash: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
