import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import Stripe from 'stripe';
import { TransactionService } from '../transaction/transaction.service';
import { StripeService } from './stripe.service';

@Controller('stripe/webhook')
export class StripeWebhookController {
  constructor(
    private stripeService: StripeService,
    private transactionService: TransactionService,
  ) {}

  @Post()
  async handleWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const event = this.stripeService.constructWebhookEvent({
        payload: rawBody,
        signature,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error: unknown) {
      throw new BadRequestException(
        `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.metadata.transactionId;
    if (transactionId) {
      await this.transactionService.confirmPayment(
        transactionId,
        paymentIntent.id,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Handle failed payment logic
    console.log('Payment failed:', paymentIntent.id);
  }
}
