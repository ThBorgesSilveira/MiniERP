import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { CreateOnlyAuditEntity } from '../database/audit-entities';
import { DECIMAL, inList } from '../database/column-helpers';
import { Batch } from './batch.entity';
import {
  MOVEMENT_DIRECTIONS,
  StockMovement,
  type MovementDirection,
} from './stock-movement.entity';

// Registra quanto cada movimento de estoque pôs ou tirou de cada lote.
@Entity('batch_movements')
@Index(['stockMovementId'])
@Index(['batchId'])
@Check(inList('direction', MOVEMENT_DIRECTIONS))
@Check('"quantity" > 0')
@Check('"unit_cost" >= 0')
@Check('"unit_freight" >= 0')
export class BatchMovement extends CreateOnlyAuditEntity {
  @Column({ type: 'integer' })
  stockMovementId: number;

  @ManyToOne(() => StockMovement)
  @JoinColumn()
  stockMovement: Relation<StockMovement>;

  @Column({ type: 'integer' })
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn()
  batch: Relation<Batch>;

  @Column({ type: 'varchar' })
  direction: MovementDirection;

  @Column({ ...DECIMAL })
  quantity: string;

  @Column({ ...DECIMAL })
  unitCost: string;

  @Column({ ...DECIMAL })
  unitFreight: string;
}
