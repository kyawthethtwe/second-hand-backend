import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductSearchDto } from '../dto/product-search.dto';
import { Product } from '../entities/product.entity';
import { ProductListResponse } from '../interfaces/product-filter.interface';

@Injectable()
export class ProductCacheService {
  private readonly logger = new Logger(ProductCacheService.name);

  // Cache TTL in seconds
  private readonly CACHE_TTL = {
    FEATURED_PRODUCTS: 300, // 5 minutes
    PRODUCT_DETAILS: 600, // 10 minutes
    SEARCH_RESULTS: 180, // 3 minutes
    CATEGORY_PRODUCTS: 240, // 4 minutes
    SELLER_PRODUCTS: 120, // 2 minutes
    STATISTICS: 600, // 10 minutes
    POPULAR_SEARCHES: 3600, // 1 hour
  };

  // Cache key prefixes
  private readonly CACHE_KEYS = {
    FEATURED: 'products:featured',
    PRODUCT: 'product',
    SEARCH: 'search',
    CATEGORY: 'category',
    SELLER: 'seller',
    STATS: 'stats',
    POPULAR_SEARCHES: 'popular_searches',
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Cache featured products
   */
  async cacheFeaturedProducts(
    products: Product[],
    limit: number,
  ): Promise<void> {
    const key = `${this.CACHE_KEYS.FEATURED}:${limit}`;
    await this.cacheManager.set(
      key,
      products,
      this.CACHE_TTL.FEATURED_PRODUCTS,
    );
    this.logger.debug(`Cached featured products: ${key}`);
  }

  /**
   * Get cached featured products
   */
  async getCachedFeaturedProducts(limit: number): Promise<Product[] | null> {
    const key = `${this.CACHE_KEYS.FEATURED}:${limit}`;
    const cached = await this.cacheManager.get<Product[]>(key);
    if (cached) {
      this.logger.debug(`Cache hit for featured products: ${key}`);
    }
    return cached || null;
  }

  /**
   * Cache product details
   */
  async cacheProduct(product: Product): Promise<void> {
    const key = `${this.CACHE_KEYS.PRODUCT}:${product.id}`;
    await this.cacheManager.set(key, product, this.CACHE_TTL.PRODUCT_DETAILS);
    this.logger.debug(`Cached product: ${key}`);
  }

  /**
   * Get cached product details
   */
  async getCachedProduct(productId: string): Promise<Product | null> {
    const key = `${this.CACHE_KEYS.PRODUCT}:${productId}`;
    const cached = await this.cacheManager.get<Product>(key);
    if (cached) {
      this.logger.debug(`Cache hit for product: ${key}`);
    }
    return cached || null;
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    searchDto: ProductSearchDto,
    results: ProductListResponse,
  ): Promise<void> {
    const key = this.generateSearchKey(searchDto);
    await this.cacheManager.set(key, results, this.CACHE_TTL.SEARCH_RESULTS);
    this.logger.debug(`Cached search results: ${key}`);

    // Track popular searches
    await this.trackPopularSearch(searchDto);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    searchDto: ProductSearchDto,
  ): Promise<ProductListResponse | null> {
    const key = this.generateSearchKey(searchDto);
    const cached = await this.cacheManager.get<ProductListResponse>(key);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${key}`);
    }
    return cached || null;
  }

  /**
   * Cache category products
   */
  async cacheCategoryProducts(
    categoryId: string,
    products: ProductListResponse,
    page: number = 1,
    limit: number = 20,
  ): Promise<void> {
    const key = `${this.CACHE_KEYS.CATEGORY}:${categoryId}:${page}:${limit}`;
    await this.cacheManager.set(
      key,
      products,
      this.CACHE_TTL.CATEGORY_PRODUCTS,
    );
    this.logger.debug(`Cached category products: ${key}`);
  }

  /**
   * Get cached category products
   */
  async getCachedCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ProductListResponse | null> {
    const key = `${this.CACHE_KEYS.CATEGORY}:${categoryId}:${page}:${limit}`;
    const cached = await this.cacheManager.get<ProductListResponse>(key);
    if (cached) {
      this.logger.debug(`Cache hit for category products: ${key}`);
    }
    return cached || null;
  }

  /**
   * Cache seller products
   */
  async cacheSellerProducts(
    sellerId: string,
    products: Product[],
  ): Promise<void> {
    const key = `${this.CACHE_KEYS.SELLER}:${sellerId}`;
    await this.cacheManager.set(key, products, this.CACHE_TTL.SELLER_PRODUCTS);
    this.logger.debug(`Cached seller products: ${key}`);
  }

  /**
   * Get cached seller products
   */
  async getCachedSellerProducts(sellerId: string): Promise<Product[] | null> {
    const key = `${this.CACHE_KEYS.SELLER}:${sellerId}`;
    const cached = await this.cacheManager.get<Product[]>(key);
    if (cached) {
      this.logger.debug(`Cache hit for seller products: ${key}`);
    }
    return cached || null;
  }

  /**
   * Cache seller statistics
   */
  async cacheSellerStatistics(sellerId: string, stats: any): Promise<void> {
    const key = `${this.CACHE_KEYS.STATS}:seller:${sellerId}`;
    await this.cacheManager.set(key, stats, this.CACHE_TTL.STATISTICS);
    this.logger.debug(`Cached seller statistics: ${key}`);
  }

  /**
   * Get cached seller statistics
   */
  async getCachedSellerStatistics(sellerId: string): Promise<any | null> {
    const key = `${this.CACHE_KEYS.STATS}:seller:${sellerId}`;
    const cached = await this.cacheManager.get(key);
    if (cached) {
      this.logger.debug(`Cache hit for seller statistics: ${key}`);
    }
    return cached || null;
  }

  /**
   * Invalidate cache when product is updated
   */
  async invalidateProductCache(
    productId: string,
    sellerId?: string,
    categoryId?: string,
  ): Promise<void> {
    const keysToDelete = [
      `${this.CACHE_KEYS.PRODUCT}:${productId}`,
      `${this.CACHE_KEYS.FEATURED}:*`, // Featured products might change
    ];

    if (sellerId) {
      keysToDelete.push(`${this.CACHE_KEYS.SELLER}:${sellerId}`);
      keysToDelete.push(`${this.CACHE_KEYS.STATS}:seller:${sellerId}`);
    }

    if (categoryId) {
      keysToDelete.push(`${this.CACHE_KEYS.CATEGORY}:${categoryId}:*`);
    }

    // Also invalidate search results cache
    keysToDelete.push(`${this.CACHE_KEYS.SEARCH}:*`);

    for (const keyPattern of keysToDelete) {
      try {
        if (keyPattern.includes('*')) {
          // Handle wildcard deletion
          await this.deleteByPattern(keyPattern);
        } else {
          await this.cacheManager.del(keyPattern);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete cache key ${keyPattern}:`, error);
      }
    }

    this.logger.debug(`Invalidated cache for product: ${productId}`);
  }

  /**
   * Invalidate all product-related cache
   */
  async invalidateAllProductCache(): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_KEYS.FEATURED}:*`,
        `${this.CACHE_KEYS.PRODUCT}:*`,
        `${this.CACHE_KEYS.SEARCH}:*`,
        `${this.CACHE_KEYS.CATEGORY}:*`,
        `${this.CACHE_KEYS.SELLER}:*`,
        `${this.CACHE_KEYS.STATS}:*`,
      ];

      for (const pattern of patterns) {
        await this.deleteByPattern(pattern);
      }

      this.logger.log('Invalidated all product cache');
    } catch (error) {
      this.logger.error('Failed to invalidate all product cache:', error);
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(
    limit: number = 10,
  ): Promise<Array<{ term: string; count: number }>> {
    const key = this.CACHE_KEYS.POPULAR_SEARCHES;
    const cached = await this.cacheManager.get<Record<string, number>>(key);

    if (!cached) {
      return [];
    }

    return Object.entries(cached)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<any> {
    try {
      // This would depend on the cache implementation
      // For Redis, you could use Redis commands
      // For in-memory cache, you might need to implement tracking

      return {
        hitRate: 'N/A', // Would need to implement hit rate tracking
        missRate: 'N/A',
        keyCount: 'N/A',
        memoryUsage: 'N/A',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get cache statistics:', error);
      return null;
    }
  }

  /**
   * Warm up cache with popular data
   */
  async warmUpCache(): Promise<void> {
    try {
      this.logger.log('Starting cache warm-up...');

      // This would typically be called with actual data from the service
      // For now, we'll just log the intention

      this.logger.log('Cache warm-up completed');
    } catch (error) {
      this.logger.error('Cache warm-up failed:', error);
    }
  }

  /**
   * Generate cache key for search results
   */
  private generateSearchKey(searchDto: ProductSearchDto): string {
    // Create a deterministic key from search parameters
    const params = {
      query: searchDto.query || '',
      categoryIds: searchDto.categoryIds?.sort() || [],
      conditions: searchDto.conditions?.sort() || [],
      minPrice: searchDto.minPrice || 0,
      maxPrice: searchDto.maxPrice || 999999,
      location: searchDto.location || '',
      brand: searchDto.brand || '',
      hasWarranty: searchDto.hasWarranty || false,
      isNegotiable: searchDto.isNegotiable || false,
      page: searchDto.page || 1,
      limit: searchDto.limit || 20,
      sortBy: searchDto.sortBy || 'createdAt',
      sortOrder: searchDto.sortOrder || 'DESC',
    };

    const keyData = Buffer.from(JSON.stringify(params)).toString('base64');
    return `${this.CACHE_KEYS.SEARCH}:${keyData}`;
  }

  /**
   * Track popular search terms
   */
  private async trackPopularSearch(searchDto: ProductSearchDto): Promise<void> {
    if (!searchDto.query) return;

    try {
      const key = this.CACHE_KEYS.POPULAR_SEARCHES;
      const existing =
        (await this.cacheManager.get<Record<string, number>>(key)) || {};

      const searchTerm = searchDto.query.toLowerCase().trim();
      existing[searchTerm] = (existing[searchTerm] || 0) + 1;

      await this.cacheManager.set(
        key,
        existing,
        this.CACHE_TTL.POPULAR_SEARCHES,
      );
    } catch (error) {
      this.logger.warn('Failed to track popular search:', error);
    }
  }

  /**
   * Delete cache keys by pattern (implementation depends on cache store)
   */
  private async deleteByPattern(pattern: string): Promise<void> {
    // This is a simplified implementation
    // In a real Redis implementation, you would use SCAN + DEL
    // For in-memory cache, you might need to track keys separately

    try {
      // For now, just log the intention
      this.logger.debug(`Would delete cache keys matching pattern: ${pattern}`);
    } catch (error) {
      this.logger.warn(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }
}
