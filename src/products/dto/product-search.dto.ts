import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ProductCondition } from '../entities/product.entity';

export class ProductSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(ProductCondition, { each: true })
  conditions?: ProductCondition[];

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number = 50;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  minYear?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  maxYear?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['price', 'createdAt', 'viewCount', 'distance'])
  sortBy?: 'price' | 'createdAt' | 'viewCount' | 'distance' = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
