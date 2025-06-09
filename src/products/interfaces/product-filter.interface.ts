import {
  Product,
  ProductCondition,
  ProductStatus,
} from '../entities/product.entity';

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
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
