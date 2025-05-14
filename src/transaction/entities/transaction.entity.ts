import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user/user.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  buyer: User;

  @Column()
  buyerId: string;

  @ManyToOne(() => User)
  seller: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  productId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  productPrice: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0.005 }) // 0.5%
  commissionRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  commissionAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellerPayout: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  paymentIntentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  calculateCommission() {
    this.commissionAmount = +(this.productPrice * this.commissionRate).toFixed(
      2,
    );
    this.sellerPayout = +(this.productPrice - this.commissionAmount).toFixed(2);
  }
}
