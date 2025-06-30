import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  Product,
  ProductCondition,
  ProductStatus,
} from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCacheService } from './services/product-cache.service';

describe('ProductsController (integration)', () => {
  let app: INestApplication;
  let controller: ProductsController;
  let service: ProductsService;
  let repository: Repository<Product>;

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
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  const mockUser = {
    id: 'seller-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
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
      controllers: [ProductsController],
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

    app = module.createNestApplication();
    await app.init();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [mockProduct];
      const mockResult = {
        products: mockProducts,
        total: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].id).toBe(mockProduct.id);
      expect(response.body.products[0].title).toBe(mockProduct.title);
    });
  });

  describe('Controller methods', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        title: 'New Product',
        description: 'New Description',
        price: 150,
        condition: ProductCondition.GOOD,
        location: 'New Location',
        latitude: 40.7128,
        longitude: -74.006,
        categoryId: 'category-123',
      };

      const expectedProduct = { ...mockProduct, ...createProductDto };
      jest.spyOn(service, 'create').mockResolvedValue(expectedProduct);

      const mockReq = {
        user: mockUser,
        body: createProductDto,
      };

      const result = await controller.create(createProductDto, mockReq as any);

      expect(result).toEqual(expectedProduct);
      expect(service.create).toHaveBeenCalledWith(
        createProductDto,
        mockUser.id,
      );
    });

    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
        price: 200,
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedProduct);

      const mockReq = {
        user: mockUser,
        params: { id: mockProduct.id },
        body: updateProductDto,
      };

      const result = await controller.update(
        mockProduct.id,
        updateProductDto,
        mockReq as any,
      );

      expect(result).toEqual(updatedProduct);
      expect(service.update).toHaveBeenCalledWith(
        mockProduct.id,
        updateProductDto,
        mockUser.id,
      );
    });

    it('should get my products', async () => {
      const mockUserProducts = [mockProduct];
      jest
        .spyOn(service, 'getSellerProducts')
        .mockResolvedValue(mockUserProducts);

      const mockReq = {
        user: mockUser,
      };

      const result = await controller.getMyProducts(mockReq as any);

      expect(result).toEqual(mockUserProducts);
      expect(service.getSellerProducts).toHaveBeenCalledWith(mockUser.id);
    });

    it('should get seller statistics', async () => {
      const mockProducts = [mockProduct];
      jest.spyOn(service, 'getSellerProducts').mockResolvedValue(mockProducts);

      const mockReq = {
        user: mockUser,
      };

      const result = await controller.getProductStatistics(mockReq as any);

      expect(result).toEqual({
        totalProducts: 1,
        activeProducts: 1,
        soldProducts: 0,
        totalViews: 5,
        totalFavorites: 2,
      });
      expect(service.getSellerProducts).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
