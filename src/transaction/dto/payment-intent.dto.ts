import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Transaction ID to create payment for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Payment method types to allow',
    example: ['card', 'promptpay'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  paymentMethodTypes?: string[];

  @ApiProperty({
    description: 'Return URL after payment',
    example: 'https://yourapp.com/payment/success',
    required: false,
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
