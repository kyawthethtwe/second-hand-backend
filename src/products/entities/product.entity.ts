import {
  Column,
  CreateDateColumn,
  Entity,
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
}

@Entity()
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

  //   @OneToMany(() => ProductImage, (image) => image.product, {
  //     cascade: true,
  //   })
  //   images: ProductImage[];

  @Column({ default: false })
  isNegotiable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
