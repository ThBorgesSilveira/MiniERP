import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { NoDeleteAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { Product } from '../products/product.entity';
import { Sale } from './sale.entity';

// O custo e o frete unitários ficam vazios até a efetivação da venda.
@Entity('sale_materials')
@Index(['saleId'])
@Index(['productId'])
@Check('"quantity" > 0')
@Check('"unit_cost" >= 0')
@Check('"unit_freight" >= 0')
export class SaleMaterial extends NoDeleteAuditEntity {
  @Column({ type: 'integer' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.materials)
  @JoinColumn()
  sale: Relation<Sale>;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ ...DECIMAL })
  quantity: string;

  @Column({ ...DECIMAL, nullable: true })
  unitCost: string | null;

  @Column({ ...DECIMAL, nullable: true })
  unitFreight: string | null;
}
