import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { User } from '../../users/entities/user/user.entity';

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  HIDDEN = 'hidden',
  PENDING_REVIEW = 'pending_review',
  RESERVED = 'reserved',
  EXPIRED = 'expired',
}

@Entity()
@Index(['price', 'condition', 'status']) // Composite index for common queries
@Index(['sellerId', 'status']) // Index for seller's products
@Index(['categoryId', 'status', 'price']) // Index for category browsing
@Index(['location']) // Index for location-based searches
@Index(['createdAt']) // Index for sorting by date
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.GOOD,
  })
  condition: ProductCondition;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  // Dynamic attributes as JSON
  @Column('jsonb', { nullable: true })
  attributes: Record<string, any>;

  @Column({ nullable: true })
  location: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @ManyToOne(() => User, (user) => user.products)
  seller: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column()
  categoryId: string;

  @Column({ default: false })
  isNegotiable: boolean;

  // Analytics and engagement
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  // Additional product details for second-hand market
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column('int', { nullable: true })
  yearOfPurchase: number;

  @Column({ default: false })
  hasWarranty: boolean;

  @Column({ nullable: true })
  warrantyExpiration: Date;

  @Column({ nullable: true })
  reasonForSelling: string;

  @Column({ default: false })
  isUrgentSale: boolean;

  @Column({ nullable: true })
  availableUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
