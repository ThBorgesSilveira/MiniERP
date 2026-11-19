import { Column, Entity, Index } from 'typeorm';
import { SystemAuditEntity } from './audit-entities';

// Descreve cada tabela e cada campo. A linha sem field_name descreve a tabela.
@Entity('field_dictionary')
@Index(['tableName'], { unique: true, where: '"field_name" IS NULL' })
@Index(['tableName', 'fieldName'], {
  unique: true,
  where: '"field_name" IS NOT NULL',
})
export class FieldDictionary extends SystemAuditEntity {
  @Column({ type: 'varchar' })
  tableName: string;

  @Column({ type: 'varchar', nullable: true })
  fieldName: string | null;

  @Column({ type: 'text' })
  description: string;
}
