import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { SetCategoryVisibilityDto } from './dto/set-category-visibility.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';
import { Wallet } from './entities/wallet.entity';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  async create(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req,
  ): Promise<Wallet> {
    // Validate the user
    const user = await this.usersService.findById(createWalletDto.userId);

    if (user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to create wallet');
    }
    return await this.walletsService.create(createWalletDto, user);
  }

  @Get('/user/:id')
  async findAll(@Request() req, @Param('id') id: number) {
    const user = await this.usersService.findById(id);

    if (user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to fetch wallet list');
    }

    return await this.walletsService.findAll(user.id);
  }

  // @Get(':id')
  // findOne(@Param('id') id: number) {
  //   return this.walletsService.findOne(+id);
  // }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateWalletDto: UpdateWalletDto,
    @Request() req,
  ) {
    // Check wallet is existing
    const wallet = await this.walletsService.findOne(id);
    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }

    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      throw new UnauthorizedException(
        'You have no access to update this wallet',
      );
    }

    return this.walletsService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    // Check wallet is existing
    const wallet = await this.walletsService.findOne(id);

    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }

    return await this.walletsService.remove(wallet.id);
  }

  // Category ids hidden from this wallet. Categories themselves stay
  // global per-user; this is per-wallet visibility only.
  @Get(':id/hidden-categories')
  async getHiddenCategories(@Param('id') id: number, @Request() req) {
    const owned = await this.walletsService.belongsToUser(+id, req.user.id);

    if (!owned) {
      throw new UnauthorizedException('Unable to fetch this wallet');
    }

    return await this.walletsService.getHiddenCategoryIds(+id);
  }

  @Patch(':id/categories/:categoryId/visibility')
  async setCategoryVisibility(
    @Param('id') id: number,
    @Param('categoryId') categoryId: number,
    @Body() setCategoryVisibilityDto: SetCategoryVisibilityDto,
    @Request() req,
  ) {
    const walletOwned = await this.walletsService.belongsToUser(
      +id,
      req.user.id,
    );

    if (!walletOwned) {
      throw new UnauthorizedException('Unable to modify this wallet');
    }

    const categoryOwned = await this.categoriesService.belongsToUser(
      +categoryId,
      req.user.id,
    );

    if (!categoryOwned) {
      throw new BadRequestException('Category does not exist.');
    }

    await this.walletsService.setCategoryVisibility(
      +id,
      +categoryId,
      setCategoryVisibilityDto.hidden,
    );

    return {
      walletId: +id,
      categoryId: +categoryId,
      hidden: setCategoryVisibilityDto.hidden,
    };
  }
}
