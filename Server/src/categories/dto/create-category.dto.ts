import { ApiProperty, PickType } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';
import { IsNumber } from 'class-validator';

export class CreateCategoryDto extends PickType(Category, [
  'name',
  'icon',
  'type',
]) {
  @ApiProperty({ type: 'number' })
  @IsNumber()
  userId: number;
}
