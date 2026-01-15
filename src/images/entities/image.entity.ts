import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum ImageType {
  PRODUCT = 'product',
  PROFILE = 'profile',
  CATEGORY = 'category',
  BANNER = 'banner',
  OTHER = 'other',
}

import { Product } from '../../products/entities/product.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  publicId: string; // Cloudinary public ID for resource management

  @Column({ nullable: true })
  alt: string;

  @Column({ default: false })
  isMain: boolean; // Whether this is the main/primary image

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  format: string; // jpg, png, webp, etc.

  @Column({
    type: 'enum',
    enum: ImageType,
    default: ImageType.OTHER,
  })
  type: ImageType;

  @Column({ nullable: true })
  entityId: string; // ID of the related entity (product, user, category, etc.)

  @Column({ nullable: true })
  entityType: string; // Type of the related entity (product, user, category, etc.)

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  product: Product;

  @Column({ nullable: true })
  productId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
