import { Injectable, Logger } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not defined in configuration');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createPaymentIntent(params: {
    amount: number; //in cent
    currency?: string;
    customerId?: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    const {
      amount,
      currency = 'thb',
      customerId,
      metadata = {},
      description,
    } = params;
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      description,
      automatic_payment_methods: { enabled: true },
    });
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    return await this.stripe.customers.create(params);
  }

  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason,
  ): Promise<Stripe.Refund> {
    return await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount,
      reason,
    });
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not defined in configuration');
    }
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
