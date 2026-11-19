import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { NoDeleteAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { Product } from '../products/product.entity';

// Todos os valores ficam na unidade-base do produto.
@Entity('batches')
@Index(['productId', 'entryDate', 'id'])
@Check('"initial_quantity" > 0')
@Check('"balance" >= 0')
@Check('"unit_cost" >= 0')
@Check('"unit_freight" >= 0')
export class Batch extends NoDeleteAuditEntity {
  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ type: 'date' })
  entryDate: string;

  @Column({ ...DECIMAL })
  initialQuantity: string;

  @Column({ ...DECIMAL })
  unitCost: string;

  @Column({ ...DECIMAL })
  unitFreight: string;

  @Column({ ...DECIMAL })
  balance: string;
}
