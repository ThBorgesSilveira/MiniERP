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
import { DECIMAL, inList } from '../database/column-helpers';
import { Person } from '../people/person.entity';
import { Sale } from '../sales/sale.entity';
import { PurchaseItem } from './purchase-item.entity';

export const PURCHASE_STATUSES = ['ordered', 'received'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

// A compra de devolução tem returned_sale_id, nasce recebida e não tem fornecedor.
@Entity('purchases')
@Index(['supplierId'])
@Index(['purchaseDate'])
@Index(['returnedSaleId'], {
  unique: true,
  where: '"returned_sale_id" IS NOT NULL',
})
@Check(inList('status', PURCHASE_STATUSES))
@Check('"freight_amount" >= 0')
@Check(`("status" = 'received') = ("received_date" IS NOT NULL)`)
@Check(
  `("returned_sale_id" IS NULL AND "supplier_id" IS NOT NULL) OR ("returned_sale_id" IS NOT NULL AND "supplier_id" IS NULL AND "status" = 'received')`,
)
export class Purchase extends FullAuditEntity {
  @Column({ type: 'integer', nullable: true })
  supplierId: number | null;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn()
  supplier: Relation<Person> | null;

  @Column({ type: 'date' })
  purchaseDate: string;

  @Column({ ...DECIMAL })
  freightAmount: string;

  @Column({ type: 'varchar', default: 'ordered' })
  status: PurchaseStatus;

  @Column({ type: 'date', nullable: true })
  receivedDate: string | null;

  @Column({ type: 'integer', nullable: true })
  returnedSaleId: number | null;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn()
  returnedSale: Relation<Sale> | null;

  @OneToMany(() => PurchaseItem, (item) => item.purchase)
  items: Relation<PurchaseItem[]>;
}
