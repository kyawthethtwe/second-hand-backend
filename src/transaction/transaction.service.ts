// src/transaction/transaction.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionItemDto } from './dto/update-transaction-item.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  ItemStatus,
  TransactionItem,
} from './entities/transaction-item.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private transactionItemRepository: Repository<TransactionItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private stripeService: StripeService,
  ) {}

  // ==================== TRANSACTION METHODS ====================

  async createTransaction(
    buyerId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate buyer exists
      const buyer = await this.userRepository.findOne({
        where: { id: buyerId },
      });
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }

      // 2. Validate all products exist and are available
      const productIds = createTransactionDto.items.map(
        (item) => item.productId,
      );
      const products = await this.productRepository.find({
        where: { id: In(productIds) },
        relations: ['seller'], // Load seller relationship
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products not found');
      }

      // 3. Check product availability and stock
      const unavailableProducts = products.filter(
        (product) => !product.isAvailable || product.quantity === 0,
      );
      if (unavailableProducts.length > 0) {
        throw new BadRequestException(
          `Products not available: ${unavailableProducts.map((p) => p.title).join(', ')}`,
        );
      }

      // 4. Validate quantities
      for (const item of createTransactionDto.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        if (item.quantity > product.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.title}. Available: ${product.quantity}, Requested: ${item.quantity}`,
          );
        }
      }

      // 5. Create transaction
      const transaction = this.transactionRepository.create({
        buyerId,
        buyer,
        shippingInstructions: createTransactionDto.shippingInfo,
        status: TransactionStatus.PENDING,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // 6. Create transaction items
      let totalAmount = 0;
      let totalCommission = 0;
      const transactionItems: TransactionItem[] = [];

      for (const itemDto of createTransactionDto.items) {
        const product = products.find((p) => p.id === itemDto.productId);
        if (!product) {
          throw new BadRequestException(
            `Product ${itemDto.productId} not found`,
          );
        }
        const unitPrice = itemDto.unitPrice || product.price;

        const transactionItem = this.transactionItemRepository.create({
          transactionId: savedTransaction.id,
          transaction: savedTransaction,
          productId: product.id,
          product,
          sellerId: product.sellerId,
          seller: product.seller,
          quantity: itemDto.quantity,
          unitPrice,
          status: ItemStatus.PENDING,
        });

        // Commission will be calculated by @BeforeInsert hook
        const savedItem = await queryRunner.manager.save(transactionItem);

        transactionItems.push(savedItem);

        totalAmount += savedItem.totalPrice;
        totalCommission += savedItem.commissionAmount;

        // 7. Update product stock
        await queryRunner.manager.update(Product, product.id, {
          quantity: product.quantity - itemDto.quantity,
        });
      }

      // 8. Update transaction totals
      await queryRunner.manager.update(Transaction, savedTransaction.id, {
        totalAmount,
        totalCommission,
      });

      await queryRunner.commitTransaction();

      // 9. Return transaction with items
      return this.findOne(savedTransaction.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: TransactionQueryDto): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.buyer', 'buyer')
      .leftJoinAndSelect('transaction.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.seller', 'seller');

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: query.status,
      });
    }

    if (query.buyerId) {
      queryBuilder.andWhere('transaction.buyerId = :buyerId', {
        buyerId: query.buyerId,
      });
    }

    if (query.sellerId) {
      queryBuilder.andWhere('items.sellerId = :sellerId', {
        sellerId: query.sellerId,
      });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('transaction.createdAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('transaction.createdAt <= :toDate', {
        toDate: query.toDate,
      });
    }

    // Pagination
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['buyer', 'items', 'items.product', 'items.seller'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findByBuyer(
    buyerId: string,
    query: TransactionQueryDto,
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...query, buyerId });
  }

  async findBySeller(
    sellerId: string,
    query: TransactionQueryDto,
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...query, sellerId });
  }

  async updateTransaction(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // Validate status transitions
    if (updateTransactionDto.status) {
      this.validateStatusTransition(
        transaction.status,
        updateTransactionDto.status,
      );
    }

    await this.transactionRepository.update(id, updateTransactionDto);
    return this.findOne(id);
  }

  async cancelTransaction(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // Only buyer can cancel, and only if not yet shipped
    if (transaction.buyerId !== userId) {
      throw new ForbiddenException(
        'Only the buyer can cancel this transaction',
      );
    }

    if (
      ![TransactionStatus.PENDING, TransactionStatus.PAID].includes(
        transaction.status,
      )
    ) {
      throw new BadRequestException(
        'Transaction cannot be cancelled at this stage',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cancel transaction
      await queryRunner.manager.update(Transaction, id, {
        status: TransactionStatus.CANCELLED,
        cancellationReason: reason,
      });

      // 2. Cancel all items
      await queryRunner.manager.update(
        TransactionItem,
        { transactionId: id },
        { status: ItemStatus.CANCELLED },
      );

      // 3. Restore product stock
      for (const item of transaction.items) {
        await queryRunner.manager.increment(
          Product,
          { id: item.productId },
          'quantity',
          item.quantity,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateTransactionItem(
    itemId: string,
    sellerId: string,
    updateItemDto: UpdateTransactionItemDto,
  ): Promise<TransactionItem | null> {
    const item = await this.transactionItemRepository.findOne({
      where: { id: itemId },
      relations: ['transaction', 'seller'],
    });

    if (!item) {
      throw new NotFoundException('Transaction item not found');
    }

    // Only the seller can update their items
    if (item.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own items');
    }

    // Validate status transitions
    if (updateItemDto.status) {
      this.validateItemStatusTransition(item.status, updateItemDto.status);
    }

    // Auto-set timestamps based on status
    const updateData = { ...updateItemDto };
    if (
      updateItemDto.status === ItemStatus.SHIPPED &&
      !updateItemDto.shippedAt
    ) {
      updateData.shippedAt = new Date().toISOString();
    }
    if (
      updateItemDto.status === ItemStatus.DELIVERED &&
      !updateItemDto.deliveredAt
    ) {
      updateData.deliveredAt = new Date().toISOString();
    }

    await this.transactionItemRepository.update(itemId, updateData);

    // Check if all items are delivered to complete transaction
    await this.checkAndCompleteTransaction(item.transactionId);

    return this.transactionItemRepository.findOne({
      where: { id: itemId },
      relations: ['transaction', 'product', 'seller'],
    });
  }

  async getSellerItems(
    sellerId: string,
    query: TransactionQueryDto,
  ): Promise<{
    data: TransactionItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.transactionItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.transaction', 'transaction')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('transaction.buyer', 'buyer')
      .where('item.sellerId = :sellerId', { sellerId });

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('item.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('transaction.createdAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('transaction.createdAt <= :toDate', {
        toDate: query.toDate,
      });
    }

    // Pagination
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string | null; transactionId: string }> {
    const transaction = await this.findOne(
      createPaymentIntentDto.transactionId,
    );

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not in pending state');
    }

    try {
      const amountInCents = Math.round(transaction.totalAmount * 100);

      //create or get stripe customer
      let stripeCustomerId = transaction.buyer.stripeCustomerId;
      if (!stripeCustomerId) {
        const stripeCustomer = await this.stripeService.createCustomer({
          email: transaction.buyer.email,
          name: transaction.buyer.name,
          phone: transaction.buyer.phone,
          metadata: { userId: transaction.buyer.id },
        });
        stripeCustomerId = stripeCustomer.id;

        //save stripe customer id
        await this.userRepository.update(transaction.buyer.id, {
          stripeCustomerId,
        });
      }

      //create payment intent
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: amountInCents,
        customerId: stripeCustomerId,
        metadata: {
          transactionId: transaction.id,
          buyerId: transaction.buyer.id,
        },
        description: `Order #${transaction.id.slice(-8)} - ${transaction.items.length} items`,
      });

      //update transaction with payment intent id
      await this.transactionRepository.update(transaction.id, {
        paymentIntentId: paymentIntent.id,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction.id,
      };
    } catch (error: unknown) {
      throw new BadRequestException(
        `Payment intent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Confirm a payment
  async confirmPayment(
    transactionId: string,
    paymentIntentId: string,
    // paymentMetadata?: any,
  ): Promise<Transaction> {
    // Find the transaction
    const transaction = await this.findOne(transactionId);

    // Check if the payment intent ID matches
    if (transaction.paymentIntentId !== paymentIntentId) {
      throw new BadRequestException('Payment intent mismatch');
    }

    // Verify with stripe
    const paymentIntent =
      await this.stripeService.retrievePaymentIntent(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment not successful');
    }

    // Update the transaction status
    await this.transactionRepository.update(transactionId, {
      status: TransactionStatus.PAID,
      paymentMetadata: JSON.stringify({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        chargeId: paymentIntent.latest_charge,
        paidAt: new Date().toISOString(),
      }),
    });

    // Update all items to paid status
    await this.transactionItemRepository.update(
      { transactionId },
      { status: ItemStatus.PAID },
    );

    return this.findOne(transactionId);
  }

  // HELPER METHODS
  private validateStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): void {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.PAID,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAID]: [
        TransactionStatus.SHIPPING,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.SHIPPING]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.COMPLETED]: [TransactionStatus.REFUNDED],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.REFUNDED]: [],
    };

    // Validate the status transition
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private validateItemStatusTransition(
    currentStatus: ItemStatus,
    newStatus: ItemStatus,
  ): void {
    const validTransitions: Record<ItemStatus, ItemStatus[]> = {
      [ItemStatus.PENDING]: [ItemStatus.PAID, ItemStatus.CANCELLED],
      [ItemStatus.PAID]: [ItemStatus.PROCESSING, ItemStatus.CANCELLED],
      [ItemStatus.PROCESSING]: [ItemStatus.SHIPPED, ItemStatus.CANCELLED],
      [ItemStatus.SHIPPED]: [ItemStatus.DELIVERED],
      [ItemStatus.DELIVERED]: [],
      [ItemStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid item status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async checkAndCompleteTransaction(
    transactionId: string,
  ): Promise<void> {
    const items = await this.transactionItemRepository.find({
      where: { transactionId },
    });

    const allDelivered = items.every(
      (item) => item.status === ItemStatus.DELIVERED,
    );

    if (allDelivered) {
      await this.transactionRepository.update(transactionId, {
        status: TransactionStatus.COMPLETED,
      });
    }
  }

  // ANALYTICS METHODS

  async getSellerStats(sellerId: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    interface SellerStatsRaw {
      totalSales: string | null;
      totalRevenue: string | null;
      totalCommission: string | null;
      pendingOrders: string | null;
      completedOrders: string | null;
    }

    // Get seller statistics
    const stats: SellerStatsRaw | undefined =
      await this.transactionItemRepository
        .createQueryBuilder('item')
        .select([
          'COUNT(*) as totalSales',
          'SUM(item.sellerPayout) as totalRevenue',
          'SUM(item.commissionAmount) as totalCommission',
          "COUNT(CASE WHEN item.status IN ('pending', 'paid', 'processing', 'shipped') THEN 1 END) as pendingOrders",
          "COUNT(CASE WHEN item.status = 'delivered' THEN 1 END) as completedOrders",
        ])
        .where('item.sellerId = :sellerId', { sellerId })
        .getRawOne();

    // If no stats found, return default values
    if (!stats) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };
    }

    return {
      totalSales: parseInt(stats.totalSales ?? '0') || 0,
      totalRevenue: parseFloat(stats.totalRevenue ?? '0') || 0,
      totalCommission: parseFloat(stats.totalCommission ?? '0') || 0,
      pendingOrders: parseInt(stats.pendingOrders ?? '0') || 0,
      completedOrders: parseInt(stats.completedOrders ?? '0') || 0,
    };
  }

  async getBuyerStats(buyerId: string): Promise<{
    totalPurchases: number;
    totalSpent: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    interface BuyerStatsRaw {
      totalPurchases: string | null;
      totalSpent: string | null;
      pendingOrders: string | null;
      completedOrders: string | null;
    }

    // Get buyer statistics
    const stats: BuyerStatsRaw | undefined = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'COUNT(*) as totalPurchases',
        'SUM(transaction.totalAmount) as totalSpent',
        "COUNT(CASE WHEN transaction.status IN ('pending', 'paid', 'shipping') THEN 1 END) as pendingOrders",
        "COUNT(CASE WHEN transaction.status = 'completed' THEN 1 END) as completedOrders",
      ])
      .where('transaction.buyerId = :buyerId', { buyerId })
      .getRawOne();

    // If no stats found, return default values
    if (!stats) {
      return {
        totalPurchases: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };
    }

    return {
      totalPurchases: parseInt(stats.totalPurchases ?? '0') || 0,
      totalSpent: parseFloat(stats.totalSpent ?? '0') || 0,
      pendingOrders: parseInt(stats.pendingOrders ?? '0') || 0,
      completedOrders: parseInt(stats.completedOrders ?? '0') || 0,
    };
  }
}
