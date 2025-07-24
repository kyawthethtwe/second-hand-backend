import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Create transaction (buyer only)
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  createTransaction(
    @Body(ValidationPipe) createTransactionDto: CreateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Use authenticated user ID as buyer
    return this.transactionService.createTransaction(
      req.user.id,
      createTransactionDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all transactions (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query(ValidationPipe) query: TransactionQueryDto) {
    return this.transactionService.findAll(query);
  }

  // ===== SPECIFIC ROUTES FIRST (before :id route) =====

  // Get current user's purchases
  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get current user's purchases" })
  @ApiResponse({
    status: 200,
    description: 'Purchases retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyPurchases(
    @Query(ValidationPipe) query: TransactionQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.findAll({ ...query, buyerId: req.user.id });
  }

  // Get current user's sales
  @Get('my-sales')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get current user's sales" })
  @ApiResponse({
    status: 200,
    description: 'Sales retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMySales(
    @Query(ValidationPipe) query: TransactionQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.findAll({ ...query, sellerId: req.user.id });
  }

  @Get('my-items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get current user's transaction items" })
  @ApiResponse({
    status: 200,
    description: 'Transaction items retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyItems(
    @Query(ValidationPipe) query: TransactionQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.getSellerItems(req.user.id, query);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get current user's transaction statistics" })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyStats(@Req() req: AuthenticatedRequest) {
    // Return both buyer and seller stats for current user
    return Promise.all([
      this.transactionService.getBuyerStats(req.user.id),
      this.transactionService.getSellerStats(req.user.id),
    ]).then(([buyerStats, sellerStats]) => ({
      buyer: buyerStats,
      seller: sellerStats,
    }));
  }

  // ===== PARAMETER ROUTES LAST =====

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  updateTransaction(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(id, updateTransactionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction cancelled successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  cancelTransaction(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body('reason') reason?: string,
  ) {
    // Use authenticated user ID - only buyer can cancel
    return this.transactionService.cancelTransaction(id, req.user.id, reason);
  }

  @Patch('item/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update transaction item status' })
  @ApiResponse({
    status: 200,
    description: 'Transaction item updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction item not found' })
  updateTransactionItem(
    @Param('itemId') itemId: string,
    @Body(ValidationPipe) updateItemDto: UpdateTransactionItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Use authenticated user ID - only seller can update their items
    return this.transactionService.updateTransactionItem(
      itemId,
      req.user.id,
      updateItemDto,
    );
  }

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  createPaymentIntent(
    @Body(ValidationPipe) createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.transactionService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('confirm-payment/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm payment for transaction' })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
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
}
