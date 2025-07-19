import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the product at time of purchase',
    example: 299.99,
  })
  @IsInt() // or @IsNumber() if you want to allow decimals
  unitPrice: number; // This will be fetched from product, but can be overridden

  @ApiProperty({
    description: 'Any special notes for this item',
    example: 'Please pack carefully',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
