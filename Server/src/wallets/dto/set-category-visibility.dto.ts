import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCategoryVisibilityDto {
  @ApiProperty()
  @IsBoolean()
  hidden: boolean;
}
