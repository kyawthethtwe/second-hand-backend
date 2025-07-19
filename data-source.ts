import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from './src/category/entities/category.entity';
import { Product } from './src/products/entities/product.entity';
import { TransactionItem } from './src/transaction/entities/transaction-item.entity';
import { User } from './src/users/entities/user/user.entity';
import { Image } from './src/images/entities/image.entity';
import { Transaction } from './src/transaction/entities/transaction.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Product, Category, TransactionItem, Image, Transaction],
  migrations: ['./src/migrations/*.ts'],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
