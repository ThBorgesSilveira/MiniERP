import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { CreateOnlyAuditEntity } from '../database/audit-entities';
import { DECIMAL, inList } from '../database/column-helpers';
import { ListItem } from '../lists/list-item.entity';
import { Product } from '../products/product.entity';

export const MOVEMENT_DIRECTIONS = ['in', 'out'] as const;
export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number];

export const STOCK_MOVEMENT_TYPES = [
  'purchase_in',
  'assembly_out',
  'assembly_in',
  'sale_out',
  'adjustment_in',
  'adjustment_out',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_ORIGIN_TYPES = [
  'purchase_item',
  'sale_item_component',
  'sale_item',
  'sale_material',
  'adjustment',
] as const;
export type StockOriginType = (typeof STOCK_ORIGIN_TYPES)[number];

// Livro de registro: o movimento nunca muda.
// O origin_id não tem chave estrangeira: um serviço confere a origem.
@Entity('stock_movements')
@Index(['originType', 'originId'])
@Index(['productId', 'movementDate'])
@Check(inList('direction', MOVEMENT_DIRECTIONS))
@Check(inList('type', STOCK_MOVEMENT_TYPES))
@Check(inList('origin_type', STOCK_ORIGIN_TYPES))
@Check('"quantity" > 0')
@Check(
  `("type" IN ('purchase_in', 'assembly_in', 'adjustment_in') AND "direction" = 'in') OR ("type" IN ('assembly_out', 'sale_out', 'adjustment_out') AND "direction" = 'out')`,
)
@Check(
  `("type" IN ('adjustment_in', 'adjustment_out')) = ("origin_type" = 'adjustment')`,
)
@Check(
  `("origin_type" = 'adjustment' AND "origin_id" IS NULL AND "reason_id" IS NOT NULL) OR ("origin_type" <> 'adjustment' AND "origin_id" IS NOT NULL AND "reason_id" IS NULL)`,
)
export class StockMovement extends CreateOnlyAuditEntity {
  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ type: 'date' })
  movementDate: string;

  @Column({ type: 'varchar' })
  direction: MovementDirection;

  @Column({ ...DECIMAL })
  quantity: string;

  @Column({ type: 'varchar' })
  type: StockMovementType;

  @Column({ type: 'varchar' })
  originType: StockOriginType;

  @Column({ type: 'integer', nullable: true })
  originId: number | null;

  @Column({ type: 'integer', nullable: true })
  reasonId: number | null;

  @ManyToOne(() => ListItem, { nullable: true })
  @JoinColumn()
  reason: Relation<ListItem> | null;
}
