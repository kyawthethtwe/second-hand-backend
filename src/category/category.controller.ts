import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user/user.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.categoryService.findAll();
  }

  // ===== SPECIFIC ROUTES FIRST =====

  // Upload a single image for a category
  @Post(':id/image')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isMain') isMain?: boolean,
  ) {
    console.log('=== UPLOAD IMAGE ROUTE HIT ===');
    console.log('Category ID:', id);
    console.log('Uploaded file in controller:', file);
    return this.categoryService.uploadImage(id, file, isMain);
  }

  // Upload multiple images for a category
  @Post(':id/images')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMultipleImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.categoryService.uploadMultipleImages(id, files);
  }

  // Get all images for a category
  @Get(':id/images')
  @Public()
  getImages(@Param('id') id: string) {
    return this.categoryService.getImages(id);
  }

  // Delete an image from a category
  @Delete(':id/image/:imageId')
  @Roles(UserRole.ADMIN)
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.categoryService.deleteImage(id, imageId);
  }

  // ===== GENERAL ROUTES LAST =====

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
