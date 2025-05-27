import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCacheService } from './services/product-cache.service';
import { ProductIndexingService } from './services/product-indexing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 1000, // maximum number of items in cache
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductCacheService, ProductIndexingService],
  exports: [ProductsService, ProductCacheService, ProductIndexingService],
})
export class ProductsModule {}
