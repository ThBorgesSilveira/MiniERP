import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { NoDeleteAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { ListItem } from '../lists/list-item.entity';
import { Product } from '../products/product.entity';
import { Purchase } from './purchase.entity';

// O frete rateado fica vazio até a confirmação do recebimento.
@Entity('purchase_items')
@Index(['purchaseId'])
@Index(['productId'])
@Check('"quantity" > 0')
@Check('"unit_cost" >= 0')
@Check('"allocated_freight" >= 0')
export class PurchaseItem extends NoDeleteAuditEntity {
  @Column({ type: 'integer' })
  purchaseId: number;

  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  @JoinColumn()
  purchase: Relation<Purchase>;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ type: 'integer' })
  unitId: number;

  @ManyToOne(() => ListItem)
  @JoinColumn()
  unit: Relation<ListItem>;

  @Column({ ...DECIMAL })
  quantity: string;

  @Column({ ...DECIMAL })
  unitCost: string;

  @Column({ ...DECIMAL, nullable: true })
  allocatedFreight: string | null;
}
