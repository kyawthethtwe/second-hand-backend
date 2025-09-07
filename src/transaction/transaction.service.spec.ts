import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import {
  ItemStatus,
  TransactionItem,
} from './entities/transaction-item.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import {
  Product,
  ProductCondition,
  ProductStatus,
} from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user/user.entity';
import { StripeService } from 'src/stripe/stripe.service';
import { UserRole, AuthProvider } from '../users/entities/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: jest.Mocked<Repository<Transaction>>;
  let transactionItemRepository: jest.Mocked<Repository<TransactionItem>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let stripeService: jest.Mocked<StripeService>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  //mock user data
  const mockUser: User = {
    id: 'user-123',
    email: 'buyer@test.com',
    name: 'John Doe',
    phone: '+66123456789',
    stripeCustomerId: null,
    role: UserRole.USER,
    provider: AuthProvider.EMAIL,
    password: 'hashedpassword',
    products: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  //mock product
  const mockProduct: Product = {
    id: 'product-123',
    title: 'Test Product',
    description: 'Test Description',
    price: 299.99,
    quantity: 10,
    isAvailable: true,
    sellerId: 'seller-123',
    seller: { ...mockUser, id: 'seller-123', email: 'seller@test.com' },
    categoryId: 'category-123',
    category: null,
    condition: ProductCondition.NEW,
    status: ProductStatus.ACTIVE,
    images: [],
    favoriteCount: 0,
    viewCount: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  //mock transaction
  const mockTransaction: Transaction = {
    id: 'txn-123',
    buyerId: 'user-123',
    buyer: mockUser,
    totalAmount: 299.99,
    totalCommission: 15.0,
    status: TransactionStatus.PENDING,
    paymentIntentId: null,
    paymentMetadata: null,
    shippingInstructions: {
      recipientName: 'John Doe',
      phone: '+66123456789',
      address: '123 Test St, Bangkok, Thailand',
    },
    cancellationReason: null,
    items: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  //mock transaction item
  const mockTransactionItem: TransactionItem = {
    id: 'item-123',
    transactionId: 'txn-123',
    transaction: mockTransaction,
    productId: 'product-123',
    product: mockProduct,
    sellerId: 'seller-123',
    seller: mockProduct.seller,
    quantity: 1,
    unitPrice: 299.99,
    otalPrice: 299.99,
    commissionRate: 0.05,
    commissionAmount: 15.0,
    sellerPayout: 284.99,
    status: ItemStatus.PENDING,
    trackingNumber: null,
    shippingMethod: null,
    shippedAt: null,
    deliveredAt: null,
    calculateAmounts: jest.fn(),
  };

  //mock payment intent
  const mockStripePaymentIntent = {
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret_xyz',
    amount: 29999,
    currency: 'thb',
    status: 'requires_payment_method',
    metadata: {
      transactionId: 'txn-123',
      buyerId: 'user-123',
    },
    latest_charge: null,
  };

  //mock stripe customer
  const mockStripeCustomer = {
    id: 'cus_test_123',
    email: 'buyer@test.com',
    name: 'John Doe',
  };

  beforeEach(async () => {
    // Create mocked query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        update: jest.fn(),
        increment: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TransactionItem),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: StripeService,
          useValue: {
            createPaymentIntent: jest.fn(),
            createCustomer: jest.fn(),
            retrievePaymentIntent: jest.fn(),
            createRefund: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get(getRepositoryToken(Transaction));
    transactionItemRepository = module.get(getRepositoryToken(TransactionItem));
    productRepository = module.get(getRepositoryToken(Product));
    userRepository = module.get(getRepositoryToken(User));
    stripeService = module.get(StripeService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const createTransactionDto: CreateTransactionDto = {
      items: [
        {
          productId: 'product-123',
          quantity: 1,
          unitPrice: 299.99,
        },
      ],
      shippingInfo: {
        recipientName: 'John Doe',
        phone: '+66123456789',
        address: '123 Test St, Bangkok, Thailand',
      },
    };

    it('should create a transaction successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.find.mockResolvedValue([mockProduct]);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionItemRepository.create.mockReturnValue(mockTransactionItem);
      queryRunner.manager.save
        .mockResolvedValueOnce(mockTransaction) // Save transaction
        .mockResolvedValueOnce(mockTransactionItem);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockTransaction,
        items: [mockTransactionItem],
      });

      // Act
      const result = await service.createTransaction(
        'user-123',
        createTransactionDto,
      );

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(productRepository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object) },
        relations: ['seller'],
      });

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should throw error if buyer not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createTransaction('user-123', createTransactionDto),
      ).rejects.toThrow(new NotFoundException('Buyer not found'));
    });

    it('should throw error if product not available', async () => {
      // Arrange
      const unavailableProduct = { ...mockProduct, isAvailable: false };
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.find.mockResolvedValue([unavailableProduct]);

      // Act & Assert
      await expect(
        service.createTransaction('user-123', createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if insufficient stock', async () => {
      // Arrange
      const lowStockProduct = { ...mockProduct, quantity: 0 };
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.find.mockResolvedValue([lowStockProduct]);

      // Act & Assert
      await expect(
        service.createTransaction('user-123', createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.find.mockResolvedValue([mockProduct]);
      transactionRepository.create.mockReturnValue(mockTransaction);
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.createTransaction('user-123', createTransactionDto),
      ).rejects.toThrow('Database error');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('createPaymentIntent', () => {
    const createPaymentIntentDto: CreatePaymentIntentDto = {
      transactionId: 'txn-123',
    };

    it('should create payment intent for new customer', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer as any);
      stripeService.createPaymentIntent.mockResolvedValue(
        mockStripePaymentIntent as any,
      );
      transactionRepository.update.mockResolvedValue({} as any);
      userRepository.update.mockResolvedValue({} as any);

      // Act
      const result = await service.createPaymentIntent(createPaymentIntentDto);

      // Assert
      expect(result).toEqual({
        clientSecret: 'pi_test_123_secret_xyz',
        transactionId: 'txn-123',
      });

      expect(stripeService.createCustomer).toHaveBeenCalledWith({
        email: 'buyer@test.com',
        name: 'John Doe',
        phone: '+66123456789',
        metadata: { userId: 'user-123' },
      });

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith({
        amount: 29999,
        customerId: 'cus_test_123',
        metadata: {
          transactionId: 'txn-123',
          buyerId: 'user-123',
        },
        description: 'Order #txn-123 - 0 items',
      });

      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        stripeCustomerId: 'cus_test_123',
      });

      expect(transactionRepository.update).toHaveBeenCalledWith('txn-123', {
        paymentIntentId: 'pi_test_123',
      });
    });

    it('should reuse existing Stripe customer', async () => {
      // Arrange
      const existingCustomerTransaction = {
        ...mockTransaction,
        buyer: { ...mockUser, stripeCustomerId: 'cus_existing_123' },
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existingCustomerTransaction);
      stripeService.createPaymentIntent.mockResolvedValue(
        mockStripePaymentIntent as any,
      );
      transactionRepository.update.mockResolvedValue({} as any);

      // Act
      await service.createPaymentIntent(createPaymentIntentDto);

      // Assert
      expect(stripeService.createCustomer).not.toHaveBeenCalled();
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cus_existing_123',
        }),
      );
    });
    it('should throw error if transaction is not pending', async () => {
      // Arrange
      const paidTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PAID,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(paidTransaction);

      // Act & Assert
      await expect(
        service.createPaymentIntent(createPaymentIntentDto),
      ).rejects.toThrow(
        new BadRequestException('Transaction is not in pending state'),
      );
    });
    it('should handle Stripe errors gracefully', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction);
      stripeService.createCustomer.mockRejectedValue(
        new Error('Stripe API Error'),
      );

      // Act & Assert
      await expect(
        service.createPaymentIntent(createPaymentIntentDto),
      ).rejects.toThrow(
        new BadRequestException(
          'Payment intent creation failed: Stripe API Error',
        ),
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm successful payment', async () => {
      // Arrange
      const transactionWithPaymentIntent = {
        ...mockTransaction,
        paymentIntentId: 'pi_test_123',
      };

      const succeededPaymentIntent = {
        ...mockStripePaymentIntent,
        status: 'succeeded',
        latest_charge: 'ch_test_123',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(transactionWithPaymentIntent)
        .mockResolvedValueOnce({
          ...transactionWithPaymentIntent,
          status: TransactionStatus.PAID,
        });

      stripeService.retrievePaymentIntent.mockResolvedValue(
        succeededPaymentIntent as any,
      );
      transactionRepository.update.mockResolvedValue({} as any);
      transactionItemRepository.update.mockResolvedValue({} as any);

      // Act
      const result = await service.confirmPayment('txn-123', 'pi_test_123');

      // Assert
      expect(stripeService.retrievePaymentIntent).toHaveBeenCalledWith(
        'pi_test_123',
      );

      expect(transactionRepository.update).toHaveBeenCalledWith('txn-123', {
        status: TransactionStatus.PAID,
        paymentMetadata: JSON.stringify({
          id: 'pi_test_123',
          amount: 29999,
          status: 'succeeded',
          chargeId: 'ch_test_123',
          paidAt: expect.any(String),
        }),
      });

      expect(transactionItemRepository.update).toHaveBeenCalledWith(
        { transactionId: 'txn-123' },
        { status: ItemStatus.PAID },
      );

      expect(result.status).toBe(TransactionStatus.PAID);
    });

    it('should throw error for payment intent mismatch', async () => {
      // Arrange
      const transactionWithDifferentPaymentIntent = {
        ...mockTransaction,
        paymentIntentId: 'pi_different_123',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(transactionWithDifferentPaymentIntent);

      // Act & Assert
      await expect(
        service.confirmPayment('txn-123', 'pi_test_123'),
      ).rejects.toThrow(new BadRequestException('Payment intent mismatch'));
    });

    it('should throw error for failed payment', async () => {
      // Arrange
      const transactionWithPaymentIntent = {
        ...mockTransaction,
        paymentIntentId: 'pi_test_123',
      };

      const failedPaymentIntent = {
        ...mockStripePaymentIntent,
        status: 'payment_failed',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(transactionWithPaymentIntent);
      stripeService.retrievePaymentIntent.mockResolvedValue(
        failedPaymentIntent as any,
      );

      // Act & Assert
      await expect(
        service.confirmPayment('txn-123', 'pi_test_123'),
      ).rejects.toThrow(new BadRequestException('Payment not successful'));
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully', async () => {
      // Arrange
      const transactionWithItems = {
        ...mockTransaction,
        items: [mockTransactionItem],
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(transactionWithItems)
        .mockResolvedValueOnce({
          ...transactionWithItems,
          status: TransactionStatus.CANCELLED,
        });

      queryRunner.manager.update.mockResolvedValue({} as any);
      queryRunner.manager.increment.mockResolvedValue({} as any);

      // Act
      const result = await service.cancelTransaction(
        'txn-123',
        'user-123',
        'Changed mind',
      );

      // Assert
      expect(queryRunner.manager.update).toHaveBeenCalledWith(
        Transaction,
        'txn-123',
        {
          status: TransactionStatus.CANCELLED,
          cancellationReason: 'Changed mind',
        },
      );

      expect(queryRunner.manager.update).toHaveBeenCalledWith(
        TransactionItem,
        { transactionId: 'txn-123' },
        { status: ItemStatus.CANCELLED },
      );

      expect(queryRunner.manager.increment).toHaveBeenCalledWith(
        Product,
        { id: 'product-123' },
        'quantity',
        1,
      );

      expect(result.status).toBe(TransactionStatus.CANCELLED);
    });

    it('should throw error if not buyer', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction);

      // Act & Assert
      await expect(
        service.cancelTransaction('txn-123', 'different-user', 'Changed mind'),
      ).rejects.toThrow(
        new ForbiddenException('Only the buyer can cancel this transaction'),
      );
    });

    it('should throw error if transaction cannot be cancelled', async () => {
      // Arrange
      const shippingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SHIPPING,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(shippingTransaction);

      // Act & Assert
      await expect(
        service.cancelTransaction('txn-123', 'user-123', 'Changed mind'),
      ).rejects.toThrow(
        new BadRequestException(
          'Transaction cannot be cancelled at this stage',
        ),
      );
    });
  });

  describe('findOne', () => {
    it('should find transaction by id', async () => {
      // Arrange
      transactionRepository.findOne.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.findOne('txn-123');

      // Assert
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        relations: ['buyer', 'items', 'items.product', 'items.seller'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error if transaction not found', async () => {
      // Arrange
      transactionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Transaction not found'),
      );
    });
  });
});
