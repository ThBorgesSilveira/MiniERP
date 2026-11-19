import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { inList } from '../database/column-helpers';
import { ListItem } from '../lists/list-item.entity';
import { ProductUnit } from './product-unit.entity';

export const PRODUCT_TYPES = ['merchandise', 'material'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

// O nome é único só entre os produtos ativos e não excluídos.
@Entity('products')
@Index(['name'], {
  unique: true,
  where: '"is_active" AND "deleted_at" IS NULL',
})
@Check(inList('type', PRODUCT_TYPES))
@Check(`NOT "is_composite" OR "type" = 'merchandise'`)
export class Product extends FullAuditEntity {
  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'integer' })
  baseUnitId: number;

  @ManyToOne(() => ListItem)
  @JoinColumn()
  baseUnit: Relation<ListItem>;

  @Column({ type: 'integer', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => ListItem, { nullable: true })
  @JoinColumn()
  category: Relation<ListItem> | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar' })
  type: ProductType;

  @Column({ type: 'boolean', default: false })
  isComposite: boolean;

  @OneToMany(() => ProductUnit, (unit) => unit.product)
  units: Relation<ProductUnit[]>;
}
