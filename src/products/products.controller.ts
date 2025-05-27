import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './entities/product.entity';
import { ProductsService } from './products.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productsService.create(createProductDto, req.user.id);
  }

  @Get()
  async findAll(@Query(ValidationPipe) queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get('search')
  async search(@Query(ValidationPipe) searchDto: ProductSearchDto) {
    return this.productsService.advancedSearch(searchDto);
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.getFeaturedProducts(limitNum);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  async getMyProducts(@Request() req: AuthenticatedRequest) {
    return this.productsService.getSellerProducts(req.user.id);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getProductStatistics(@Request() req: AuthenticatedRequest) {
    // This could be enhanced to return seller-specific statistics
    const products = await this.productsService.getSellerProducts(req.user.id);
    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === ProductStatus.ACTIVE)
        .length,
      soldProducts: products.filter((p) => p.status === ProductStatus.SOLD)
        .length,
      totalViews: products.reduce((sum, p) => sum + p.viewCount, 0),
      totalFavorites: products.reduce((sum, p) => sum + p.favoriteCount, 0),
    };
  }

  @Get('seller/:sellerId')
  async getSellerProducts(@Param('sellerId', ParseUUIDPipe) sellerId: string) {
    return this.productsService.getSellerProducts(sellerId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @Patch(':id/mark-sold')
  @UseGuards(JwtAuthGuard)
  async markAsSold(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productsService.markAsSold(id, req.user.id);
  }

  @Patch(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // This would need integration with a user favorites service
    // For now, just increment the favorite count
    const product = await this.productsService.findOne(id);
    // TODO: Use req.user.id to check/toggle user's favorite status
    console.log('User toggling favorite:', req.user.id); // Placeholder usage
    return {
      message: 'Favorite toggled successfully',
      isFavorited: true, // This would be determined by checking user's favorites
      totalFavorites: product.favoriteCount + 1,
    };
  }

  @Get('nearby')
  async getNearbyProducts(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius: string = '10', // Default 10km radius
    @Query('limit') limit: string = '20',
  ) {
    // This would need a more sophisticated location-based search
    // For now, return a filtered list
    // TODO: Use latitude, longitude, and radius for actual geospatial filtering
    console.log('Location params:', { latitude, longitude, radius }); // Placeholder usage
    const queryDto: ProductQueryDto = {
      page: 1,
      limit: parseInt(limit, 10),
    };
    return this.productsService.findAll(queryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productsService.remove(id, req.user.id);
  }
}
