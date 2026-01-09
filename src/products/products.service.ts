import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  // Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image, ImageType } from 'src/images/entities/image.entity';
import { In, Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { ImagesService } from '../images/images.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import {
  ProductFilterOptions,
  ProductListResponse,
  ProductWithImages,
} from './interfaces/product-filter.interface';
import { ProductCacheService } from './services/product-cache.service';
@Injectable()
export class ProductsService {
  // private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
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
      includeImages = false,
      favorited,
      userId,
    } = options || {};

    const skip = (page - 1) * limit;
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status })
      .andWhere('product.quantity > 0');

    // Add filters
    if (search) {
      query.andWhere('product.title ILIKE :search', { search: `%${search}%` });
    }
    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (condition) {
      query.andWhere('product.condition = :condition', { condition });
    }
    if (sellerId) {
      query.andWhere('product.sellerId = :sellerId', { sellerId });
    }
    if (location) {
      query.andWhere('product.location ILIKE :location', {
        location: `%${location}%`,
      });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined) {
        query.andWhere('product.price >= :minPrice', { minPrice });
      }
      if (maxPrice !== undefined) {
        query.andWhere('product.price <= :maxPrice', { maxPrice });
      }
    }

    // Handle favorites filtering
    if (favorited && userId) {
      query.innerJoin(
        'product.favoritedBy',
        'favorite',
        'favorite.userId = :userId',
        { userId },
      );
    }

    // Apply sorting and pagination
    query.orderBy(`product.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [products, total] = await query.getManyAndCount();

    // Optionally include images
    let productsWithImages = products;
    if (includeImages) {
      productsWithImages = await Promise.all(
        products.map(async (product) => {
          const images = await this.imageService.findByEntity(
            product.id,
            'product',
          );
          return { ...product, images };
        }),
      );
    }
    // Decorate with favorite status if userId is provided
    if (userId && !favorited) {
      productsWithImages = await this.decorateWithFavoriteStatus(
        productsWithImages,
        userId,
      );
    }
    // this.logger.log(
    //   `Fetched Products - count: ${Array.isArray(productsWithImages) ? productsWithImages.length : 0}`,
    // );
    // this.logger.debug(`Products data: ${JSON.stringify(productsWithImages)}`);
    return {
      products: productsWithImages,
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

  // Toggle favorite
  async toggleFavorite(
    userId: string,
    productId: string,
  ): Promise<{
    isFavorited: boolean;
    favoriteCount: number;
    message: string;
  }> {
    // check the product exist
    const product = await this.productRepository.findOne({
      where: { id: productId },
      select: ['id', 'title', 'isAvailable'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.isAvailable) {
      throw new BadRequestException(
        `Product with ID ${productId} is not available`,
      );
    }

    // check if already favorited
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { userId, productId },
    });

    let isFavorited: boolean;
    let message: string;

    if (existingFavorite) {
      //remove from favorites
      await this.userFavoriteRepository.remove(existingFavorite);
      //update favorite count
      await this.productRepository.decrement(
        { id: productId },
        'favoriteCount',
        1,
      );
      isFavorited = false;
      message = 'Removed from favorites';
    } else {
      // add to favorites
      const favorite = this.userFavoriteRepository.create({
        userId,
        productId,
      });
      await this.userFavoriteRepository.save(favorite);
      // update favorite count
      await this.productRepository.increment(
        { id: productId },
        'favoriteCount',
        1,
      );
      isFavorited = true;
      message = 'Added to favorites';
    }

    // get updated favorite count
    const favoriteCount = await this.userFavoriteRepository.count({
      where: { productId },
    });

    return {
      isFavorited,
      favoriteCount,
      message,
    };
  }

  // get user favorites
  async getUserFavorites(
    userId: string,
    queryDto: ProductQueryDto,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.findAll({
      ...queryDto,
      favorited: true,
      userId,
    });

    return {
      products: result.products,
      total: result.total,
      page: result.page,
      limit: queryDto.limit || 20,
    };
  }

  async getFavoriteCount(userId: string): Promise<number> {
    return this.userFavoriteRepository.count({
      where: { userId },
    });
  }

  async clearAllFavorites(
    userId: string,
  ): Promise<{ message: string; count: number }> {
    const favorites = await this.userFavoriteRepository.find({
      where: { userId },
    });
    const count = favorites.length;
    await this.userFavoriteRepository.remove(favorites);

    return {
      message: 'All favorites cleared',
      count,
    };
  }

  private async decorateWithFavoriteStatus(
    products: Product[],
    userId: string,
  ): Promise<Product[]> {
    if (!products.length || !userId) return products;

    const productIds = products.map((p) => p.id);
    const favorites = await this.userFavoriteRepository.find({
      where: {
        userId,
        productId: In(productIds),
      },
      select: ['productId'],
    });
    const favoritSet = new Set(favorites.map((f) => f.productId));

    return products.map((product) => ({
      ...product,
      isFavorited: favoritSet.has(product.id),
    }));
  }
  // Update product with seller authorization
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    isAdmin: boolean = false,
    files?: Express.Multer.File[],
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

    // Handle image replacement if new images are provided
    if (files && files.length > 0) {
      try {
        // Delete old images from Cloudinary and database
        await this.imageService.removeByEntity(id, 'product');

        // Upload new images
        await this.imageService.addMultipleImages(files, {
          type: ImageType.PRODUCT,
          entityId: id,
          entityType: 'product',
        });
        console.log(
          `Replaced images for product ${id} with ${files.length} new images`,
        );
      } catch (error) {
        console.error('Error replacing images:', error);
        throw new BadRequestException('Failed to update product images');
      }
    }

    await this.productRepository.update(id, updateProductDto);

    // Invalidate relevant caches
    await this.cacheService.invalidateProductCache(
      id,
      product.sellerId,
      product.categoryId,
    );

    return this.findOne(id, false);
  }

  // delete product
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

    // Delete all associated images from Cloudinary and database
    await this.imageService.removeByEntity(id, 'product');

    // Delete the product from database
    await this.productRepository.delete(id);

    // Invalidate relevant caches
    await this.cacheService.invalidateProductCache(
      id,
      product.sellerId,
      product.categoryId,
    );
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

  async getSellerProducts(
    sellerId: string,
  ): Promise<Product[] | ProductWithImages[]> {
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

    // Map products to include main images
    const productsWithImages: ProductWithImages[] = await Promise.all(
      products.map(async (product) => {
        const images = await this.imageService.findByEntity(
          product.id,
          'product',
        );
        return { ...product, images };
      }),
    );
    // Cache the results
    await this.cacheService.cacheSellerProducts(sellerId, productsWithImages);

    return productsWithImages;
  }

  // Get only main/primary image for a product (for thumbnails)
  async getProductMainImage(productId: string): Promise<Image | null> {
    const images = await this.imageService.findByEntity(productId, 'product');
    return images.find((img) => img.isMain) || images[0] || null;
  }

  // Get products with only main images (optimized for listings)
  async findAllWithMainImages(
    options?: ProductFilterOptions,
  ): Promise<ProductListResponse> {
    const result = await this.findAll(options);

    const productsWithMainImages = await Promise.all(
      result.products.map(async (product) => {
        const mainImage = await this.getProductMainImage(product.id);
        return { ...product, images: mainImage ? [mainImage] : [] };
      }),
    );

    return {
      ...result,
      products: productsWithMainImages,
    };
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
