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
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
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
  async findOne(@Param('id') id: number, @Request() req) {
    const category = await this.categoriesService.findOneForUser(
      +id,
      req.user.id,
    );

    if (!category) {
      throw new UnauthorizedException('You have no access to this category');
    }

    return category;
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req,
  ) {
    const category = await this.categoriesService.findOneForUser(
      +id,
      req.user.id,
    );

    if (!category) {
      throw new UnauthorizedException(
        'You have no access to update this category',
      );
    }

    return await this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    const category = await this.categoriesService.findOneForUser(
      +id,
      req.user.id,
    );

    if (!category) {
      throw new UnauthorizedException(
        'You have no access to delete this category',
      );
    }
    return await this.categoriesService.remove(+id);
  }
}
