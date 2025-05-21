import { Product } from '../../products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProductImage {
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

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column()
  productId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
