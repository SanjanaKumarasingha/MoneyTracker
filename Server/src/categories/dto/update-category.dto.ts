import { PickType } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class UpdateCategoryDto extends PickType(Category, [
  'name',
  'icon',
  'enable',
]) {}
