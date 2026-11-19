import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { ListItem } from '../lists/list-item.entity';
import { Product } from './product.entity';

@Entity('product_units')
@Index(['productId', 'unitId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('"conversion_factor" > 0')
export class ProductUnit extends FullAuditEntity {
  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.units)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ type: 'integer' })
  unitId: number;

  @ManyToOne(() => ListItem)
  @JoinColumn()
  unit: Relation<ListItem>;

  @Column({ ...DECIMAL })
  conversionFactor: string;
}
