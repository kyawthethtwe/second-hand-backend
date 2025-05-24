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
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /**
   * Upload a single image
   */
  @Post('upload')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
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
  async findAll() {
    return this.imagesService.findAll();
  }

  /**
   * Get a specific image
   */
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.imagesService.findOne(id);
  }

  /**
   * Update image metadata
   */
  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
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
  async remove(@Param('id') id: string) {
    await this.imagesService.remove(id);
    return { message: 'Image successfully deleted' };
  }
}
