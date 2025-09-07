import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user/user.entity';
import { Product } from './product.entity';

@Entity('user_favourite')
@Index(['userId', 'productId'], { unique: true })
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (product) => product.favoritedBy, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
