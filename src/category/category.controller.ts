import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  // UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  // FilesInterceptor
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  // ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user/user.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Create a new category
  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoryService.create(createCategoryDto, image);
  }

  // Get all categories
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  findAll() {
    return this.categoryService.findAll();
  }

  // Upload a single image for a category
  // @Post(':id/image')
  // @Roles(UserRole.ADMIN)
  // @UseInterceptors(FileInterceptor('file'))
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Upload an image to a category (Admin only)' })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({
  //   status: 201,
  //   description: 'Image uploaded successfully',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Forbidden - Admin access required',
  // })
  // @ApiResponse({ status: 404, description: 'Category not found' })
  // uploadImage(
  //   @Param('id') id: string,
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body('isMain') isMain?: boolean,
  // ) {
  //   console.log('=== UPLOAD IMAGE ROUTE HIT ===');
  //   console.log('Category ID:', id);
  //   console.log('Uploaded file in controller:', file);
  //   return this.categoryService.uploadImage(id, file, isMain);
  // }

  // Upload multiple images for a category
  // @Post(':id/images')
  // @Roles(UserRole.ADMIN)
  // @UseInterceptors(FilesInterceptor('files', 10))
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({
  //   summary: 'Upload multiple images to a category (Admin only)',
  // })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({
  //   status: 201,
  //   description: 'Images uploaded successfully',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Forbidden - Admin access required',
  // })
  // @ApiResponse({ status: 404, description: 'Category not found' })
  // uploadMultipleImages(
  //   @Param('id') id: string,
  //   @UploadedFiles() files: Express.Multer.File[],
  // ) {
  //   return this.categoryService.uploadMultipleImages(id, files);
  // }

  // Get all images for a category
  @Get(':id/images')
  @Public()
  @ApiOperation({ summary: 'Get all images for a category' })
  @ApiResponse({
    status: 200,
    description: 'Images retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  getImages(@Param('id') id: string) {
    return this.categoryService.getImages(id);
  }

  // Delete an image from a category
  // @Delete(':id/image/:imageId')
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Delete an image from a category (Admin only)' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Image deleted successfully',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Forbidden - Admin access required',
  // })
  // @ApiResponse({ status: 404, description: 'Category or image not found' })
  // deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
  //   return this.categoryService.deleteImage(id, imageId);
  // }

  // Get a category by ID
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific category' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  // Delete a category by ID
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
