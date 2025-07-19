import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemStatus } from '../entities/transaction-item.entity';

export class UpdateTransactionItemDto {
  @ApiProperty({
    description: 'Item status',
    enum: ItemStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiProperty({
    description: 'Tracking number from shipping service',
    example: 'TH1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({
    description: 'Shipping method used',
    example: 'Grab Express',
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiProperty({
    description: 'When item was shipped',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiProperty({
    description: 'When item was delivered',
    example: '2024-01-16T14:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiProperty({
    description: 'Seller notes about shipping',
    example: 'Shipped via Grab, driver contact: 0812345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  sellerNotes?: string;
}
