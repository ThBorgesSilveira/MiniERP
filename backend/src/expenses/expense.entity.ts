import { Check, Column, Entity } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';

// A despesa sem valid_to vale por prazo indeterminado.
@Entity('expenses')
@Check('"monthly_amount" > 0')
@Check('"valid_to" IS NULL OR "valid_to" >= "valid_from"')
export class Expense extends FullAuditEntity {
  @Column({ type: 'varchar' })
  description: string;

  @Column({ ...DECIMAL })
  monthlyAmount: string;

  @Column({ type: 'date' })
  validFrom: string;

  @Column({ type: 'date', nullable: true })
  validTo: string | null;
}
