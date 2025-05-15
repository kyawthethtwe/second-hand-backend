import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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
}
