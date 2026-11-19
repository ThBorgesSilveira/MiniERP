import { Check, Column, Entity, Index } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';

// O nome é único só entre os fornecedores não excluídos.
@Entity('people')
@Index(['name'], {
  unique: true,
  where: '"is_supplier" AND "deleted_at" IS NULL',
})
@Check('"is_customer" OR "is_supplier"')
export class Person extends FullAuditEntity {
  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'boolean', default: false })
  isCustomer: boolean;

  @Column({ type: 'boolean', default: false })
  isSupplier: boolean;
}
