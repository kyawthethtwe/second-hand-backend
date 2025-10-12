import { Module, forwardRef } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [ConfigModule, forwardRef(() => TransactionModule)],
  controllers: [StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
