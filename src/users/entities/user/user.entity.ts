import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../../products/entities/product.entity';

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
}

export enum UserRole {
  USER = 'user',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
  provider: AuthProvider;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
