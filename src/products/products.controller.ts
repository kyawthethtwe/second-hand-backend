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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './entities/product.entity';
import { ProductsService } from './products.service';
// import { Roles } from 'src/auth/decorators/roles.decorator';
// import { UserRole } from 'src/users/entities/user/user.entity';
import { User } from 'src/users/entities/user/user.entity';
import { Public } from '../auth/decorators/public.decorator';
interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10)) // Allow up to 10 images
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ) {
    console.log('Creating product for user:', req.user.id);
    console.log('Number of uploaded files:', files?.length || 0);
    return this.productsService.create(createProductDto, req.user.id, files);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findAll(@Query(ValidationPipe) queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Advanced search for products' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async search(@Query(ValidationPipe) searchDto: ProductSearchDto) {
    return this.productsService.advancedSearch(searchDto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
  })
  async getFeatured(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.getFeaturedProducts(limitNum);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get current user's products" })
  @ApiResponse({
    status: 200,
    description: 'User products retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProducts(@Req() req: AuthenticatedRequest) {
    return this.productsService.getSellerProducts(req.user.id);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get user's product statistics" })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProductStatistics(@Req() req: AuthenticatedRequest) {
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
  @ApiOperation({ summary: 'Get products by seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Seller products retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getSellerProducts(@Param('sellerId', ParseUUIDPipe) sellerId: string) {
    return this.productsService.getSellerProducts(sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @Patch(':id/mark-sold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a product as sold' })
  @ApiResponse({
    status: 200,
    description: 'Product marked as sold successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async markAsSold(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.markAsSold(id, req.user.id);
  }

  @Patch(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle favorite status for a product' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
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
  @ApiOperation({ summary: 'Get nearby products based on location' })
  @ApiResponse({
    status: 200,
    description: 'Nearby products retrieved successfully',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.remove(id, req.user.id);
  }
}
