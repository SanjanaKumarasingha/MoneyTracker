import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  UnauthorizedException,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IconName, CategoryType } from '../enums';
import { CategoriesService } from '../categories/categories.service';

import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryOrderDto } from './dto/update-category-order';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('User')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Check any existed user

    const userInUsername = await this.usersService.findByUsername(
      createUserDto.username,
    );

    const userInEmail = await this.usersService.findByEmail(
      createUserDto.email,
    );

    if (userInUsername) {
      throw new UnauthorizedException('Username is already in used.');
    }

    if (userInEmail) {
      throw new UnauthorizedException('Email is already in used.');
    }

    const user = await this.usersService.create(createUserDto);

    // Pre-insert some category
    const categories: CreateCategoryDto[] = [
      {
        name: 'Transportation',
        icon: IconName.BUS,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Restaurant',
        icon: IconName.RESTAURANT,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Health',
        icon: IconName.HEALTH,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Clothing',
        icon: IconName.SHIRT,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Shopping',
        icon: IconName.SHOPPING_CART,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Education',
        icon: IconName.GRADUATION,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Travel',
        icon: IconName.AIRPLANE,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Utils',
        icon: IconName.UTILS,
        userId: user.id,
        type: CategoryType.EXPENSE,
      },
      {
        name: 'Bank',
        icon: IconName.BANK,
        userId: user.id,
        type: CategoryType.INCOME,
      },
      {
        name: 'Income',
        icon: IconName.COIN,
        userId: user.id,
        type: CategoryType.INCOME,
      },
    ];

    const categoryOrder = [];
    for await (const category of categories) {
      const newCategory = await this.categoriesService.create(category, user);
      categoryOrder.push(newCategory.id);
    }

    // Update the category order of the user
    await this.usersService.updateCategoryOrder({
      id: user.id,
      categoryOrder: categoryOrder,
    });

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req) {
    if (+id !== req.user.id) {
      throw new UnauthorizedException('Unauthorized to access this user.');
    }

    return await this.usersService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/category-order')
  async updateCategoryOrder(
    @Param('id') id: number,
    @Body() updateCategoryOrder: UpdateCategoryOrderDto,
    @Request() req,
  ) {
    if (+id !== req.user.id) {
      throw new UnauthorizedException(
        'Unauthorized to update the order of category.',
      );
    }

    const user = await this.usersService.findById(+id);
    if (!user) {
      throw new UnauthorizedException(
        'Unauthorized to update the order of category.',
      );
    }

    return await this.usersService.updateCategoryOrder({
      id: user.id,
      categoryOrder: updateCategoryOrder.categoryOrder,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (+id !== req.user.id) {
      throw new UnauthorizedException(
        'Unauthorized to update this user profile.',
      );
    }

    const user = await this.usersService.findById(+id);
    if (!user) {
      throw new UnauthorizedException(
        'Unauthorized to update the order of category.',
      );
    }

    return await this.usersService.update(user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/update-password')
  async updatePassword(
    @Param('id') id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req,
  ) {
    if (+id !== req.user.id) {
      throw new UnauthorizedException('Unauthorized to update password.');
    }

    const user = await this.usersService.findById(+id);
    if (!user) {
      throw new UnauthorizedException(
        'Unauthorized to update the order of category.',
      );
    }

    return await this.usersService.updatePassword(user, updatePasswordDto);
  }
}
