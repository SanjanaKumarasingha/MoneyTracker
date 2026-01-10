import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, user: User) {
    const category = await this.categoryRepository.create({
      name: createCategoryDto.name,
      icon: createCategoryDto.icon,
      user: user,
      enable: true,
      type: createCategoryDto.type,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(userId: number) {
    return await this.categoryRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async findOne(id: number) {
    return await this.categoryRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return await this.categoryRepository.save({
      id: id,
      name: updateCategoryDto.name,
      icon: updateCategoryDto.icon,
      enable: updateCategoryDto.enable,
    });
  }

  async remove(id: number) {
    return await this.categoryRepository.softDelete(id);
  }
}
