import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  ConstructWebhookEventDto,
  CreateCustomerDto,
  CreatePaymentIntentDto,
  CreateRefundDto,
  RetrievePaymentIntentDto,
} from './dto/create-stripe.dto';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Stripe secret key is not defined in configuration');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    const {
      amount,
      currency = 'thb',
      customerId,
      metadata = {},
      description,
    } = createPaymentIntentDto;
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
    retrievePaymentIntentDto: RetrievePaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    const { paymentIntentId } = retrievePaymentIntentDto;
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Stripe.Customer> {
    return await this.stripe.customers.create(createCustomerDto);
  }

  async createRefund(createRefundDto: CreateRefundDto): Promise<Stripe.Refund> {
    const { paymentId, amount, reason } = createRefundDto;
    return await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount,
      reason,
    });
  }

  constructWebhookEvent(
    constructWebhookEventDto: ConstructWebhookEventDto,
  ): Stripe.Event {
    const { payload, signature } = constructWebhookEventDto;
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
