import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  createTransaction(
    @Body('buyerId') buyerId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.createTransaction(
      buyerId,
      createTransactionDto,
    );
  }

  @Get()
  findAll(@Query() query: TransactionQueryDto) {
    return this.transactionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }
  // Get by buyer
  @Get('buyer/:buyerId')
  findByBuyer(
    @Param('buyerId') buyerId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactionService.findByBuyer(buyerId, query);
  }

  // Get by seller
  @Get('seller/:sellerId')
  findBySeller(
    @Param('sellerId') sellerId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactionService.findBySeller(sellerId, query);
  }

  @Patch(':id')
  updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(id, updateTransactionDto);
  }

  @Delete(':id')
  cancelTransaction(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.transactionService.cancelTransaction(id, userId, reason);
  }

  @Patch('item/:itemId')
  updateTransactionItem(
    @Param('itemId') itemId: string,
    @Body('sellerId') sellerId: string,
    @Body() updateItemDto: UpdateTransactionItemDto,
  ) {
    return this.transactionService.updateTransactionItem(
      itemId,
      sellerId,
      updateItemDto,
    );
  }

  @Get('seller/items/:sellerId')
  getSellerItems(
    @Param('sellerId') sellerId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactionService.getSellerItems(sellerId, query);
  }

  @Post('payment-intent')
  createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    return this.transactionService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('confirm-payment/:transactionId')
  confirmPayment(
    @Param('transactionId') transactionId: string,
    @Body('paymentIntentId') paymentIntentId: string,
    @Body('paymentMetadata') paymentMetadata?: any,
  ) {
    return this.transactionService.confirmPayment(
      transactionId,
      paymentIntentId,
      paymentMetadata,
    );
  }

  @Get('seller/stats/:sellerId')
  getSellerStats(@Param('sellerId') sellerId: string) {
    return this.transactionService.getSellerStats(sellerId);
  }

  @Get('buyer/stats/:buyerId')
  getBuyerStats(@Param('buyerId') buyerId: string) {
    return this.transactionService.getBuyerStats(buyerId);
  }
}
