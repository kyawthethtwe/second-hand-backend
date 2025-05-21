import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from './src/category/entities/category.entity';
import { Product } from './src/products/entities/product.entity';
import { Transaction } from './src/transaction/entities/transaction.entity';
import { User } from './src/users/entities/user/user.entity';
import { ProductImage } from './src/images/entities/image.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Product, Category, Transaction, ProductImage],
  migrations: ['./src/migrations/*.ts'],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
