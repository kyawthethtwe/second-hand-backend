import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../entities/transaction-item.entity';

export class TransactionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  commissionAmount: number;

  @ApiProperty()
  sellerPayout: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  trackingNumber?: string;

  @ApiProperty()
  shippingMethod?: string;

  @ApiProperty()
  shippedAt?: Date;

  @ApiProperty()
  deliveredAt?: Date;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalCommission: number;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  paymentIntentId?: string;

  @ApiProperty()
  shippingInstructions: any;

  @ApiProperty({ type: [TransactionItemResponseDto] })
  items: TransactionItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
