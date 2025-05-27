import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  Product,
  ProductCondition,
  ProductStatus,
} from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductCacheService } from './services/product-cache.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepository: Partial<Repository<Product>>;

  // Mock data
  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    condition: ProductCondition.GOOD,
    status: ProductStatus.ACTIVE,
    location: 'Test Location',
    latitude: 40.7128,
    longitude: -74.006,
    viewCount: 5,
    favoriteCount: 2,
    sellerId: 'seller-123',
    categoryId: 'category-123',
  } as Product;

  const mockUser = {
    id: 'seller-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    // Mock repository methods
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Mock cache service methods
    const mockCacheService = {
      invalidateProductCache: jest.fn(),
      getCachedProduct: jest.fn(),
      cacheProduct: jest.fn(),
      getCachedFeaturedProducts: jest.fn(),
      cacheFeaturedProducts: jest.fn(),
      getCachedSellerProducts: jest.fn(),
      cacheSellerProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: ProductCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.GOOD,
        location: 'Test Location',
        latitude: 40.7128,
        longitude: -74.006,
        categoryId: 'category-123',
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockProduct);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto, mockUser.id);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        sellerId: mockUser.id,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const queryDto: ProductQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockProducts = [mockProduct];
      const total = 1;

      (mockRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockProducts,
        total,
      ]);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        products: mockProducts,
        total,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should find a product by id and increment view count', async () => {
      // Create a copy to avoid mutation issues
      const productCopy = { ...mockProduct, viewCount: 5 };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(productCopy);
      (mockRepository.increment as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await service.findOne(mockProduct.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        relations: ['seller', 'category'],
      });
      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: mockProduct.id },
        'viewCount',
        1,
      );
      expect(result).toEqual({
        ...productCopy,
        viewCount: 6, // Original 5 + 1
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when user is not the seller', async () => {
      const updateProductDto = {
        title: 'Updated Product',
      };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await expect(
        service.update(mockProduct.id, updateProductDto, 'different-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product when user is the seller', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (mockRepository.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.remove(mockProduct.id, mockUser.id);

      expect(mockRepository.update).toHaveBeenCalledWith(mockProduct.id, {
        status: ProductStatus.HIDDEN,
      });
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await service.getFeaturedProducts(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ProductStatus.ACTIVE },
        relations: ['seller', 'category'],
        order: { viewCount: 'DESC', createdAt: 'DESC' },
        take: 5,
      });
      expect(result).toEqual([mockProduct]);
    });
  });
});
