import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { FullAuditEntity } from '../database/audit-entities';
import { DECIMAL } from '../database/column-helpers';
import { Product } from '../products/product.entity';
import { SalesChannel } from '../sales-channels/sales-channel.entity';

@Entity('product_prices')
@Index(['productId', 'salesChannelId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('"price" > 0')
export class ProductPrice extends FullAuditEntity {
  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Relation<Product>;

  @Column({ type: 'integer' })
  salesChannelId: number;

  @ManyToOne(() => SalesChannel)
  @JoinColumn()
  salesChannel: Relation<SalesChannel>;

  @Column({ ...DECIMAL })
  price: string;
}
