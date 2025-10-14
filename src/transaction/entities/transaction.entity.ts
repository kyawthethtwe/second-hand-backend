import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';
import { User } from '../../users/entities/user/user.entity';
import { TransactionItem } from './transaction-item.entity';

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

  @OneToMany(() => TransactionItem, (item) => item.transaction)
  items: TransactionItem[];

  @Column('numeric', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  totalAmount: number;

  @Column('numeric', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  totalCommission: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  paymentMetadata: string; // JSON string for payment details

  @Column({ nullable: true })
  paymentIntentId: string;

  // Shipping handled by sellers
  @Column('json', { nullable: true })
  shippingInstructions: any; // Buyer's address, notes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
