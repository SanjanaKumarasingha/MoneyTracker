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
  ForbiddenException,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { CategoriesService } from '../categories/categories.service';

@ApiTags('Goal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  async create(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    const user = await this.usersService.findById(createGoalDto.userId);

    if (!user || user.id !== req.user.id) {
      throw new UnauthorizedException('Unable to create goal');
    }

    const wallet = await this.walletsService.findOne(createGoalDto.walletId);
    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }
    await this.assertWalletOwned(wallet.id, req);

    let category = null;
    if (createGoalDto.categoryId) {
      category = await this.categoriesService.findOne(
        createGoalDto.categoryId,
      );
      if (!category) {
        throw new BadRequestException('Category does not exist.');
      }

      const categoryOwned = await this.categoriesService.belongsToUser(
        category.id,
        req.user.id,
      );
      if (!categoryOwned) {
        throw new ForbiddenException('You do not own this category');
      }
    }

    return await this.goalsService.create(
      createGoalDto,
      user,
      wallet,
      category,
    );
  }

  @Get('/wallet/:walletId')
  async findAllByWallet(
    @Param('walletId') walletId: number,
    @Request() req,
  ) {
    const wallet = await this.walletsService.findOne(walletId);
    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }
    await this.assertWalletOwned(wallet.id, req);

    return await this.goalsService.findAllByWalletWithProgress(wallet.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req) {
    const goal = await this.findOwnedGoal(id, req);

    const progress = await this.goalsService.computeProgress(goal);
    return Object.assign(goal, { progress });
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req,
  ) {
    await this.findOwnedGoal(id, req);

    return await this.goalsService.update(+id, updateGoalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    const goal = await this.findOwnedGoal(id, req);

    return await this.goalsService.remove(goal.id);
  }

  private async assertWalletOwned(walletId: number, req): Promise<void> {
    const owned = await this.walletsService.belongsToUser(walletId, req.user.id);
    if (!owned) {
      throw new ForbiddenException('You do not own this wallet');
    }
  }

  // A goal always belongs to exactly one wallet, so wallet ownership is
  // goal ownership.
  private async findOwnedGoal(id: number, req) {
    const goal = await this.goalsService.findOne(id);
    if (!goal) {
      throw new BadRequestException('Goal does not exist.');
    }

    const owned = await this.walletsService.belongsToUser(
      goal.wallet.id,
      req.user.id,
    );
    if (!owned) {
      throw new ForbiddenException('You do not own this goal');
    }

    return goal;
  }
}
