import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTransactionItemDto } from './create-transaction-item.dto';

export class ShippingInfoDto {
  @ApiProperty({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+66123456789',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Full address',
    example: '123 Main St, Bangkok, Thailand 10110',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Additional delivery notes',
    example: 'Leave at front desk',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Array of items to purchase',
    type: [CreateTransactionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @ApiProperty({
    description: 'Shipping information',
    type: ShippingInfoDto,
  })
  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;

  @ApiProperty({
    description: 'Payment method',
    example: 'stripe',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
