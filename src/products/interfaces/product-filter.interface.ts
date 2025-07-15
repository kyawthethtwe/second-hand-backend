import { Image } from '../../images/entities/image.entity';
import {
  Product,
  ProductCondition,
  ProductStatus,
} from '../entities/product.entity';

export interface ProductWithImages extends Product {
  images?: Image[];
}

export interface ProductFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sellerId?: string;
  status?: ProductStatus;
  sortBy?: 'price' | 'createdAt' | 'viewCount';
  sortOrder?: 'ASC' | 'DESC';
  includeImages?: boolean;
}

export interface ProductListResponse {
  products: (Product | ProductWithImages)[];
  total: number;
  page: number;
  totalPages: number;
}
