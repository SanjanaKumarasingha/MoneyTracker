import { ApiProperty, PickType } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class CreateCategoryDto extends PickType(Category, [
  'name',
  'icon',
  'type',
]) {
  @ApiProperty({ type: 'number' })
  userId: number;
}
