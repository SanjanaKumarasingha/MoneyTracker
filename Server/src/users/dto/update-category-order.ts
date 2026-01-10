import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UpdateCategoryOrderDto extends PickType(User, [
  'id',
  'categoryOrder',
]) {}
