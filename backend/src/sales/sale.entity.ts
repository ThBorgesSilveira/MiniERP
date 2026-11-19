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
import { SalesChannel } from '../sales-channels/sales-channel.entity';
import { SaleItem } from './sale-item.entity';
import { SaleMaterial } from './sale-material.entity';

export const SALE_STATUSES = ['draft', 'completed', 'returned'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

// As taxas e o rateio ficam vazios até a efetivação e o fechamento do mês.
@Entity('sales')
@Index(['saleDate'])
@Index(['customerId'])
@Index(['salesChannelId'])
@Check(inList('status', SALE_STATUSES))
@Check('"customer_freight" >= 0')
@Check('"expense_share" >= 0')
@Check('"commission_amount" >= 0')
@Check('"order_fee_amount" >= 0')
export class Sale extends FullAuditEntity {
  @Column({ type: 'integer' })
  customerId: number;

  @ManyToOne(() => Person)
  @JoinColumn()
  customer: Relation<Person>;

  @Column({ type: 'integer' })
  salesChannelId: number;

  @ManyToOne(() => SalesChannel)
  @JoinColumn()
  salesChannel: Relation<SalesChannel>;

  @Column({ type: 'date' })
  saleDate: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: SaleStatus;

  @Column({ ...DECIMAL, default: 0 })
  customerFreight: string;

  @Column({ ...DECIMAL, nullable: true })
  expenseShare: string | null;

  @Column({ ...DECIMAL, nullable: true })
  commissionAmount: string | null;

  @Column({ ...DECIMAL, nullable: true })
  orderFeeAmount: string | null;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: Relation<SaleItem[]>;

  @OneToMany(() => SaleMaterial, (material) => material.sale)
  materials: Relation<SaleMaterial[]>;
}
