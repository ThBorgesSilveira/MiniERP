import { Check, Column, Entity, Index } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { inList } from '../database/column-helpers';

export const LIST_CODES = [
  'unit',
  'adjustment_reason',
  'product_category',
] as const;
export type ListCode = (typeof LIST_CODES)[number];

@Entity('list_items')
@Index(['listCode', 'description'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check(inList('list_code', LIST_CODES))
export class ListItem extends FullAuditEntity {
  @Column({ type: 'varchar' })
  listCode: ListCode;

  @Column({ type: 'citext' })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
