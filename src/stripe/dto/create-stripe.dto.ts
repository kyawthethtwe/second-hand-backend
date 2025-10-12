import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCustomerDto {
  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class CreateRefundDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export class RetrievePaymentIntentDto {
  @IsString()
  paymentIntentId: string;
}

export class ConstructWebhookEventDto {
  payload: string | Buffer;

  @IsString()
  signature: string;
}
