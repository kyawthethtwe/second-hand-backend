import { ProductCondition, ProductStatus } from '../entities/product.entity';

export class ProductResponseDto {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  status: ProductStatus;
  attributes?: Record<string, any>;
  location?: string;
  latitude?: number;
  longitude?: number;
  categoryId: string;
  sellerId: string;
  isNegotiable: boolean;
  viewCount: number;
  favoriteCount: number;
  originalPrice?: number;
  brand?: string;
  model?: string;
  yearOfPurchase?: number;
  hasWarranty: boolean;
  warrantyExpiration?: Date;
  reasonForSelling?: string;
  isUrgentSale: boolean;
  availableUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  seller?: {
    id: string;
    name: string;
    email?: string;
  };

  category?: {
    id: string;
    name: string;
    description?: string;
  };
}

export class ProductListResponseDto {
  products: ProductResponseDto[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
