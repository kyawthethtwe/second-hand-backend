import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';
import { User } from '../../users/entities/user/user.entity';
import { UserFavorite } from './user-favorite.entity';
import { Image } from '../../images/entities/image.entity';

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

  @Column('numeric', { transformer: new ColumnNumericTransformer() })
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

  @OneToMany(() => UserFavorite, (favorite) => favorite.product)
  favoritedBy: UserFavorite[];

  @OneToMany(() => Image, (image) => image.product)
  images?: Image[];

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column()
  categoryId: string;

  @Column({ default: false })
  isNegotiable: boolean;

  @Column({ default: true })
  isAvailable: boolean;
  // Analytics and engagement
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @Column({ default: 1 })
  quantity: number;
  // Additional product details for second-hand market
  @Column('numeric', {
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
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
