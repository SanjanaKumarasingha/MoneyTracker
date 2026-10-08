import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UnauthorizedException,
  ForbiddenException,
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UsersService } from '../users/users.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const user = await this.usersService.findById(createCategoryDto.userId);

    if (!user || user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to create new category');
    }
    const category = await this.categoriesService.create(
      createCategoryDto,
      user,
    );

    // Update the category order
    await this.usersService.updateCategoryOrder({
      id: user.id,
      categoryOrder: [...user.categoryOrder, category.id],
    });

    return category;
  }

  @Get()
  async findAll(@Request() req) {
    return await this.categoriesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    await this.assertOwned(+id, req);
    return await this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req,
  ) {
    await this.assertOwned(+id, req);
    return await this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    await this.assertOwned(+id, req);
    return await this.categoriesService.remove(+id);
  }

  private async assertOwned(id: number, req): Promise<void> {
    const category = await this.categoriesService.findOne(id);
    if (!category) {
      throw new BadRequestException('Category does not exist.');
    }

    const owned = await this.categoriesService.belongsToUser(id, req.user.id);
    if (!owned) {
      throw new ForbiddenException('You do not own this category');
    }
  }
}
