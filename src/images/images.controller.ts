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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user/user.entity';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImagesService } from './images.service';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /**
   * Upload a single image
   */
  @Post('upload')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a single image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller/Admin access required',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() createImageDto: CreateImageDto,
  ) {
    return this.imagesService.create(file, createImageDto);
  }

  /**
   * Upload multiple images
   */
  @Post('upload/multiple')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 images per upload
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller/Admin access required',
  })
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createImageDto: CreateImageDto,
  ) {
    return this.imagesService.addMultipleImages(files, createImageDto);
  }

  /**
   * Get all images for an entity
   */
  @Get('entity/:entityType/:entityId')
  @Public()
  @ApiOperation({ summary: 'Get all images for a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Images retrieved successfully',
  })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.imagesService.findByEntity(entityId, entityType);
  }

  /**
   * Get all images (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all images (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Images retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll() {
    return this.imagesService.findAll();
  }

  /**
   * Get a specific image
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific image by ID' })
  @ApiResponse({
    status: 200,
    description: 'Image retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(@Param('id') id: string) {
    return this.imagesService.findOne(id);
  }

  /**
   * Update image metadata
   */
  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update image metadata' })
  @ApiResponse({
    status: 200,
    description: 'Image updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller/Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ) {
    return this.imagesService.update(id, updateImageDto);
  }

  /**
   * Delete an image
   */
  @Delete(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an image' })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Seller/Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async remove(@Param('id') id: string) {
    await this.imagesService.remove(id);
    return { message: 'Image successfully deleted' };
  }
}
