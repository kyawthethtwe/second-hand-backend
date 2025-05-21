import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ProductImage } from './entities/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload and create a new product image
   */
  async create(
    file: Express.Multer.File,
    createImageDto: CreateImageDto,
  ): Promise<ProductImage> {
    try {
      // Upload image to cloudinary
      const result = await this.cloudinaryService.uploadImage(file, {
        folder: `products/${createImageDto.productId}`,
      });

      // Create and save the image entity
      const image = this.productImageRepository.create({
        url: result.secure_url,
        publicId: result.public_id,
        alt: createImageDto.alt,
        isMain: createImageDto.isMain || false,
        order: createImageDto.order || 0,
        productId: createImageDto.productId,
        width: result.width,
        height: result.height,
        format: result.format,
      });

      // If isMain is true, make sure all other images for this product are not main
      if (image.isMain) {
        await this.productImageRepository.update(
          { productId: image.productId, isMain: true },
          { isMain: false },
        );
      }

      return this.productImageRepository.save(image);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to upload image: ${errorMessage}`);
    }
  }

  /**
   * Add multiple images to a product using parallel uploads
   */
  async addImagesToProduct(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    if (!files || files.length === 0) {
      return [];
    }

    // Find existing images to check if a main image exists
    const existingImages = await this.findByProductId(productId);
    const hasMainImage = existingImages.some((img) => img.isMain);

    try {
      // Upload all images to Cloudinary in parallel
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(
        files,
        {
          folder: `products/${productId}`,
        },
      );

      // Prepare image entities
      const imageEntities = uploadResults.map((result, index) => {
        return this.productImageRepository.create({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: index === 0 && !hasMainImage ? true : false,
          order: existingImages.length + index,
          productId,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      });

      // If the first image should be main (and no main exists), make sure others aren't main
      if (!hasMainImage && imageEntities.length > 0) {
        await this.productImageRepository.update(
          { productId, isMain: true },
          { isMain: false },
        );
      }

      // Save all images to database in one go
      return this.productImageRepository.save(imageEntities);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to upload images: ${errorMessage}`);
    }
  }

  /**
   * Find all images
   */
  async findAll(): Promise<ProductImage[]> {
    return this.productImageRepository.find();
  }

  /**
   * Find all images for a specific product
   */
  async findByProductId(productId: string): Promise<ProductImage[]> {
    return this.productImageRepository.find({
      where: { productId },
      order: {
        isMain: 'DESC',
        order: 'ASC',
      },
    });
  }

  /**
   * Find one image by ID
   */
  async findOne(id: string): Promise<ProductImage> {
    const image = await this.productImageRepository.findOne({ where: { id } });

    if (!image) {
      throw new NotFoundException(`Image with ID "${id}" not found`);
    }

    return image;
  }

  /**
   * Update an image
   */
  async update(
    id: string,
    updateImageDto: UpdateImageDto,
  ): Promise<ProductImage> {
    const image = await this.findOne(id);

    // If setting this image as main, unset all other images for this product
    if (updateImageDto.isMain === true) {
      await this.productImageRepository.update(
        { productId: image.productId, isMain: true },
        { isMain: false },
      );
    }

    // Update the image with new values
    Object.assign(image, updateImageDto);

    return this.productImageRepository.save(image);
  }

  /**
   * Remove an image (delete from both Cloudinary and database)
   */
  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);

    // Delete from Cloudinary if publicId exists
    if (image.publicId) {
      await this.cloudinaryService.deleteImage(image.publicId);
    }

    // Delete from database
    await this.productImageRepository.remove(image);
  }
}
