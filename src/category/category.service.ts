import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageType } from '../images/entities/image.entity';
import { ImagesService } from '../images/images.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly imagesService: ImagesService,
  ) {}

  // create a new category
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  // find all categories
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  // find a category by ID
  async findOne(id: number | string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: id.toString() },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  // update a category by ID
  async update(
    id: number | string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Update properties from DTO
    Object.assign(category, {
      ...updateCategoryDto,
      id: category.id,
    });

    return this.categoryRepository.save(category);
  }

  // remove a category by ID
  async remove(id: number | string): Promise<Category> {
    const category = await this.findOne(id);

    //  check if category has products
    if (category.products && category.products.length > 0) {
      throw new NotFoundException(
        `Cannot delete category with ID "${id}" because it has associated products`,
      );
    }

    return this.categoryRepository.remove(category);
  }

  // Upload a single image for a category
  async uploadImage(
    categoryId: string,
    file: Express.Multer.File,
    isMain: boolean = false,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    const category = await this.findOne(categoryId);

    return this.imagesService.create(file, {
      type: ImageType.CATEGORY,
      entityId: category.id,
      entityType: 'category',
      isMain,
    });
  }

  // Upload multiple images for a category
  async uploadMultipleImages(categoryId: string, files: Express.Multer.File[]) {
    const category = await this.findOne(categoryId);

    return this.imagesService.addMultipleImages(files, {
      type: ImageType.CATEGORY,
      entityId: category.id,
      entityType: 'category',
    });
  }

  // Get all images for a category
  async getImages(categoryId: string) {
    const category = await this.findOne(categoryId);
    return this.imagesService.findByEntity(category.id, 'category');
  }

  // Delete an image from a category
  async deleteImage(categoryId: string, imageId: string) {
    const category = await this.findOne(categoryId);
    const images = await this.imagesService.findByEntity(
      category.id,
      'category',
    );

    const image = images.find((img) => img.id === imageId);
    if (!image) {
      throw new NotFoundException(
        `Image with ID "${imageId}" not found for this category`,
      );
    }

    return this.imagesService.remove(imageId);
  }
}
