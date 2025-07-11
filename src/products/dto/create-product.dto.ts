import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProductCondition, ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfPurchase?: number;

  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsDateString()
  warrantyExpiration?: Date;

  @IsOptional()
  @IsString()
  reasonForSelling?: string;

  @IsOptional()
  @IsBoolean()
  isUrgentSale?: boolean;

  @IsOptional()
  @IsDateString()
  availableUntil?: Date;

  // Image file names (for tracking which images to associate after upload)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageFileNames?: string[];
}
