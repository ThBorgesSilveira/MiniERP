import { Check, Column, Entity, Index } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { DECIMAL, inList } from '../database/column-helpers';

export const FEE_BASES = ['price', 'price_plus_freight'] as const;
export type FeeBase = (typeof FEE_BASES)[number];

@Entity('sales_channels')
@Index(['name'], { unique: true, where: '"deleted_at" IS NULL' })
@Check('"commission_pct" >= 0 AND "commission_pct" <= 100')
@Check('"order_fee" >= 0')
@Check(inList('fee_base', FEE_BASES))
export class SalesChannel extends FullAuditEntity {
  @Column({ type: 'citext' })
  name: string;

  @Column({ ...DECIMAL })
  commissionPct: string;

  @Column({ ...DECIMAL })
  orderFee: string;

  @Column({ type: 'varchar' })
  feeBase: FeeBase;
}
