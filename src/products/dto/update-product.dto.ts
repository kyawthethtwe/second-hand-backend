import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
