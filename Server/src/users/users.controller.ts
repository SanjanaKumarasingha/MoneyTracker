import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Request,
  HttpCode,
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { IconName, CategoryType } from '../enums';
import { CategoriesService } from '../categories/categories.service';
import { UpdateCategoryOrderDto } from './dto/update-category-order';
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

  // Sign-up: 5 per minute per IP, to slow scripted account creation.
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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

  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }

  // The :id-param routes below only ever act on the caller's own account -
  // the param must match the authenticated user (req.user.id from the JWT).
  private assertSelf(id: number | string, req): void {
    if (Number(id) !== req.user.id) {
      throw new ForbiddenException('You can only access your own account');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    this.assertSelf(id, req);
    return await this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/category-order')
  async updateCategoryOrder(
    @Param('id') id: number,
    @Body() updateCategoryOrder: UpdateCategoryOrderDto,
    @Request() req,
  ) {
    this.assertSelf(id, req);
    // Never trust the body's id - always write to the caller's own row.
    return await this.usersService.updateCategoryOrder({
      ...updateCategoryOrder,
      id: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    this.assertSelf(id, req);
    return await this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/update-password')
  async updatePassword(
    @Param('id') id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req,
  ) {
    this.assertSelf(id, req);
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    return await this.usersService.updatePassword(user, updatePasswordDto);
  }

  // Google Play Data Safety requires an in-app account deletion path.
  // Deliberately scoped to the authenticated user only (req.user.id from
  // the JWT, no :id param to trust) rather than following the :id-param
  // pattern the other endpoints above use — deletion is destructive enough
  // that it shouldn't depend on a client-supplied id matching the token.
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(204)
  async deleteAccount(@Request() req): Promise<void> {
    await this.usersService.deleteAccount(req.user.id);
  }
}
