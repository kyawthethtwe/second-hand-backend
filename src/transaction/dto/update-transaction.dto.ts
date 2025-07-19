import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Payment intent ID from payment processor',
    example: 'pi_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({
    description: 'Payment metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  paymentMetadata?: any;

  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Customer requested cancellation',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
