import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageType } from 'src/images/entities/image.entity';
import { Between, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { ImagesService } from '../images/images.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import {
  ProductFilterOptions,
  ProductListResponse,
  ProductWithImages,
} from './interfaces/product-filter.interface';
import { ProductCacheService } from './services/product-cache.service';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: ProductCacheService,
    private readonly imageService: ImagesService,
    private readonly categoryService: CategoryService,
  ) {}
  // Create a new product
  async create(
    createProductDto: CreateProductDto,
    sellerId: string,
    files?: Express.Multer.File[],
  ): Promise<Product> {
    // Check if seller exists
    if (!sellerId) {
      throw new BadRequestException('Seller ID is required');
    }
    // Validate category ID
    if (createProductDto.categoryId) {
      const category = await this.categoryService.findOne(
        createProductDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${createProductDto.categoryId} not found`,
        );
      }
    }

    // Create product entity
    const product = this.productRepository.create({
      ...createProductDto,
      sellerId,
    });

    // Save product to database
    const savedProduct = await this.productRepository.save(product);

    // Handle image uploads if files are provided
    if (files && files.length > 0) {
      try {
        await this.imageService.addMultipleImages(files, {
          type: ImageType.PRODUCT,
          entityId: savedProduct.id,
          entityType: 'product',
        });
        console.log(
          `Uploaded ${files.length} images for product ${savedProduct.id}`,
        );
      } catch (error) {
        console.error('Error uploading images:', error);
        // You might want to delete the product if image upload fails
        // or just log the error and continue
      }
    }

    // Invalidate relevant caches
    await this.cacheService.invalidateProductCache(
      savedProduct.id,
      sellerId,
      createProductDto.categoryId,
    );

    return savedProduct;
  }

  // Find all products with filtering and pagination
  async findAll(options?: ProductFilterOptions): Promise<ProductListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      condition,
      minPrice,
      maxPrice,
      location,
      sellerId,
      status = ProductStatus.ACTIVE,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options || {};

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Product> = { status };

    // Add filters
    if (search) {
      where.title = ILike(`%${search}%`);
    }
    if (categoryId) where.categoryId = categoryId;
    if (condition) where.condition = condition;
    if (sellerId) where.sellerId = sellerId;
    if (location) where.location = ILike(`%${location}%`);
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = Between(minPrice || 0, maxPrice || 999999);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: ['seller', 'category'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Find a single product by ID and increment view count
  async findOne(
    id: string,
    incrementView: boolean = true,
  ): Promise<ProductWithImages> {
    // Try to get from cache first (only if not incrementing view)
    if (!incrementView) {
      const cachedProduct = await this.cacheService.getCachedProduct(id);
      if (cachedProduct) {
        return cachedProduct;
      }
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['seller', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Get product images
    const images = await this.imageService.findByEntity(id, 'product');
    const productWithImages: ProductWithImages = { ...product, images };

    // Increment view count if requested
    if (incrementView) {
      await this.productRepository.increment({ id }, 'viewCount', 1);
      productWithImages.viewCount += 1;

      // Invalidate cache since view count changed
      await this.cacheService.invalidateProductCache(
        id,
        product.sellerId,
        product.categoryId,
      );
    } else {
      // Cache the product if we're not incrementing view count
      await this.cacheService.cacheProduct(product);
    }

    return productWithImages;
  }

  // Update product with seller authorization
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<Product> {
    const product = await this.findOne(id, false);

    // Check if user is authorized to update
    if (!isAdmin && product.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Prevent certain status changes
    if (updateProductDto.status && !isAdmin) {
      const allowedStatuses = [ProductStatus.ACTIVE, ProductStatus.HIDDEN];
      if (!allowedStatuses.includes(updateProductDto.status)) {
        throw new BadRequestException(
          'You can only set status to ACTIVE or HIDDEN',
        );
      }
    }

    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id, false);
  }

  // Soft delete product (set status to HIDDEN)
  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const product = await this.findOne(id, false);

    // Check authorization
    if (!isAdmin && product.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Soft delete by setting status to HIDDEN
    await this.productRepository.update(id, { status: ProductStatus.HIDDEN });
  }

  // Additional utility methods for marketplace features
  async markAsSold(id: string, sellerId: string): Promise<Product> {
    const product = await this.findOne(id, false);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You can only mark your own products as sold',
      );
    }

    await this.productRepository.update(id, { status: ProductStatus.SOLD });
    return this.findOne(id, false);
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    // Try to get from cache first
    const cachedProducts =
      await this.cacheService.getCachedFeaturedProducts(limit);
    if (cachedProducts) {
      return cachedProducts;
    }

    const products = await this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['seller', 'category'],
    });

    // Cache the results
    await this.cacheService.cacheFeaturedProducts(products, limit);

    return products;
  }

  async getSellerProducts(sellerId: string): Promise<Product[]> {
    // Try to get from cache first
    const cachedProducts =
      await this.cacheService.getCachedSellerProducts(sellerId);
    if (cachedProducts) {
      return cachedProducts;
    }

    const products = await this.productRepository.find({
      where: { sellerId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    // Cache the results
    await this.cacheService.cacheSellerProducts(sellerId, products);

    return products;
  }

  // Advanced search with multiple filters
  async advancedSearch(
    searchDto: ProductSearchDto,
  ): Promise<ProductListResponse> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    // Text search
    if (searchDto.query) {
      queryBuilder.andWhere(
        '(product.title ILIKE :query OR product.description ILIKE :query)',
        { query: `%${searchDto.query}%` },
      );
    }

    // Category filter
    if (searchDto.categoryIds && searchDto.categoryIds.length > 0) {
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds: searchDto.categoryIds,
      });
    }

    // Condition filter
    if (searchDto.conditions && searchDto.conditions.length > 0) {
      queryBuilder.andWhere('product.condition IN (:...conditions)', {
        conditions: searchDto.conditions,
      });
    }

    // Price range
    if (searchDto.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: searchDto.minPrice,
      });
    }
    if (searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: searchDto.maxPrice,
      });
    }

    // Location-based search
    if (searchDto.location) {
      queryBuilder.andWhere('product.location ILIKE :location', {
        location: `%${searchDto.location}%`,
      });
    }

    // Brand filter
    if (searchDto.brand) {
      queryBuilder.andWhere('product.brand ILIKE :brand', {
        brand: `%${searchDto.brand}%`,
      });
    }

    // Warranty filter
    if (searchDto.hasWarranty !== undefined) {
      queryBuilder.andWhere('product.hasWarranty = :hasWarranty', {
        hasWarranty: searchDto.hasWarranty,
      });
    }

    // Negotiable filter
    if (searchDto.isNegotiable !== undefined) {
      queryBuilder.andWhere('product.isNegotiable = :isNegotiable', {
        isNegotiable: searchDto.isNegotiable,
      });
    }

    // Year range
    if (searchDto.minYear) {
      queryBuilder.andWhere('product.yearOfPurchase >= :minYear', {
        minYear: searchDto.minYear,
      });
    }
    if (searchDto.maxYear) {
      queryBuilder.andWhere('product.yearOfPurchase <= :maxYear', {
        maxYear: searchDto.maxYear,
      });
    }

    // Sorting
    const sortBy = searchDto.sortBy || 'createdAt';
    const sortOrder = searchDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
