import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { NoDeleteAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { Product } from '../products/product.entity';
import { SaleItem } from './sale-item.entity';

// A quantidade é por unidade de kit.
@Entity('sale_item_components')
@Index(['saleItemId'])
@Index(['productId'])
@Check('"quantity" > 0')
export class SaleItemComponent extends NoDeleteAuditEntity {
  @Column({ type: 'integer' })
  saleItemId: number;

  @ManyToOne(() => SaleItem, (saleItem) => saleItem.components)
  @JoinColumn()
  saleItem: Relation<SaleItem>;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ ...DECIMAL })
  quantity: string;
}
