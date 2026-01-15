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
import { Image, ImageType } from './entities/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //Upload and create a new image
  async create(
    file: Express.Multer.File,
    createImageDto: CreateImageDto,
  ): Promise<Image> {
    try {
      // Determine the folder structure based on image type
      const folder = this.getFolderPath(
        createImageDto.type,
        createImageDto.entityId,
      );
      console.log('Folder path for image upload:', folder);
      console.log('File being uploaded:', file);
      // Upload image to cloudinary
      const result = await this.cloudinaryService.uploadImage(file, {
        folder,
      });
      console.log('Image uploaded to Cloudinary in image service:', result);
      // Create and save the image entity
      const image = this.imageRepository.create({
        url: result.secure_url,
        publicId: result.public_id,
        alt: createImageDto.alt,
        isMain: createImageDto.isMain || false,
        order: createImageDto.order || 0,
        type: createImageDto.type,
        entityId: createImageDto.entityId,
        entityType: createImageDto.entityType,
        width: result.width,
        height: result.height,
        format: result.format,
        productId:
          createImageDto.type === ImageType.PRODUCT
            ? createImageDto.entityId
            : null,
      });
      console.log('Image entity created in image service: ', image);
      // If isMain is true, make sure all other images for this entity are not main
      if (image.isMain) {
        await this.imageRepository.update(
          {
            entityId: image.entityId,
            entityType: image.entityType,
            isMain: true,
          },
          { isMain: false },
        );
      }

      return this.imageRepository.save(image);
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to upload image: ${errorMessage}`);
    }
  }

  //Add multiple images using parallel uploads
  async addMultipleImages(
    files: Express.Multer.File[],
    createImageDto: CreateImageDto,
  ): Promise<Image[]> {
    if (!files || files.length === 0) {
      return [];
    }

    // Find existing images to check if a main image exists
    const existingImages = await this.findByEntity(
      createImageDto.entityId,
      createImageDto.entityType,
    );
    const hasMainImage = existingImages.some((img) => img.isMain);

    try {
      const folder = this.getFolderPath(
        createImageDto.type,
        createImageDto.entityId,
      );

      // Upload all images to Cloudinary in parallel
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(
        files,
        { folder },
      );

      // Prepare image entities
      const imageEntities = uploadResults.map((result, index) => {
        return this.imageRepository.create({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: index === 0 && !hasMainImage ? true : false,
          order: existingImages.length + index,
          type: createImageDto.type,
          entityId: createImageDto.entityId,
          entityType: createImageDto.entityType,
          width: result.width,
          height: result.height,
          format: result.format,
          productId:
            createImageDto.type === ImageType.PRODUCT
              ? createImageDto.entityId
              : null,
        });
      });

      // If the first image should be main (and no main exists), make sure others aren't main
      if (!hasMainImage && imageEntities.length > 0) {
        await this.imageRepository.update(
          {
            entityId: createImageDto.entityId,
            entityType: createImageDto.entityType,
            isMain: true,
          },
          { isMain: false },
        );
      }

      // Save all images to database in one go
      return this.imageRepository.save(imageEntities);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to upload images: ${errorMessage}`);
    }
  }

  //Find all images
  async findAll(): Promise<Image[]> {
    return this.imageRepository.find();
  }

  //Find all images for a specific entity
  async findByEntity(entityId: string, entityType: string): Promise<Image[]> {
    return this.imageRepository.find({
      where: { entityId, entityType },
      order: {
        isMain: 'DESC',
        order: 'ASC',
      },
    });
  }

  //Find one image by ID
  async findOne(id: string): Promise<Image> {
    const image = await this.imageRepository.findOne({ where: { id } });

    if (!image) {
      throw new NotFoundException(`Image with ID "${id}" not found`);
    }

    return image;
  }

  //Update an image
  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    const image = await this.findOne(id);

    // If setting this image as main, unset all other images for this entity
    if (updateImageDto.isMain === true) {
      await this.imageRepository.update(
        {
          entityId: image.entityId,
          entityType: image.entityType,
          isMain: true,
        },
        { isMain: false },
      );
    }

    // Update the image with new values
    Object.assign(image, updateImageDto);

    return this.imageRepository.save(image);
  }

  //remove images by entity (used when deleting an entity)
  async removeByEntity(entityId: string, entityType: string): Promise<void> {
    const images = await this.imageRepository.find({
      where: { entityId, entityType },
    });

    for (const image of images) {
      // Delete from Cloudinary if publicId exists
      if (image.publicId) {
        await this.cloudinaryService.deleteImage(image.publicId);
      }
    }
    // Delete from database
    await this.imageRepository.delete({ entityId, entityType });
  }

  //Remove an image (delete from both Cloudinary and database)
  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);

    // Delete from Cloudinary if publicId exists
    if (image.publicId) {
      await this.cloudinaryService.deleteImage(image.publicId);
    }

    // Delete from database
    await this.imageRepository.remove(image);
  }

  // Get the appropriate folder path for Cloudinary uploads
  private getFolderPath(type: ImageType, entityId: string): string {
    switch (type) {
      case ImageType.PRODUCT:
        return `products/${entityId}`;
      case ImageType.PROFILE:
        return `profiles/${entityId}`;
      case ImageType.CATEGORY:
        return `categories/${entityId}`;
      case ImageType.BANNER:
        return `banners/${entityId}`;
      default:
        return `other/${entityId}`;
    }
  }
}
