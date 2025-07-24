import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BeforeUpdate,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user/user.entity';
import { Transaction } from './transaction.entity';
export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum ItemStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing', // Seller preparing item
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity()
export class TransactionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.items)
  transaction: Transaction;

  @Column()
  transactionId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => User) // Individual seller per item
  seller: User;

  @Column()
  sellerId: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number; // unitPrice * quantity

  @Column('decimal', { precision: 10, scale: 4, default: 0.05 }) // 5%
  commissionRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  commissionAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellerPayout: number;

  // Individual item status (useful when different sellers ship separately)
  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.PENDING,
  })
  status: ItemStatus;

  // Seller-specific shipping info
  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  shippingMethod: string; // "Grab", "Lalamove", etc.

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateAmounts() {
    this.totalPrice = +(this.unitPrice * this.quantity).toFixed(2);
    this.commissionAmount = +(this.totalPrice * this.commissionRate).toFixed(2);
    this.sellerPayout = +(this.totalPrice - this.commissionAmount).toFixed(2);
  }
}
