import { Transform } from 'class-transformer';
import {
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

  @Transform(({ value }) => parseFloat(value))
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
  @Transform(({ value }) => parseFloat(value) || undefined)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value) || undefined)
  @IsNumber()
  longitude?: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || undefined)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value) || undefined)
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
  @Transform(({ value }) => parseInt(value, 10) || undefined)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfPurchase?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsDateString()
  warrantyExpiration?: Date;

  @IsOptional()
  @IsString()
  reasonForSelling?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isUrgentSale?: boolean;

  @IsOptional()
  @IsDateString()
  availableUntil?: Date;
}
