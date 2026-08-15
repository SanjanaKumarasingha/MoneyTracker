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

    let category = null;
    if (createGoalDto.categoryId) {
      category = await this.categoriesService.findOne(
        createGoalDto.categoryId,
      );
      if (!category) {
        throw new BadRequestException('Category does not exist.');
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
  async findAllByWallet(@Param('walletId') walletId: number) {
    const wallet = await this.walletsService.findOne(walletId);
    if (!wallet) {
      throw new BadRequestException('Wallet does not exist.');
    }

    return await this.goalsService.findAllByWalletWithProgress(wallet.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const goal = await this.goalsService.findOne(id);
    if (!goal) {
      throw new BadRequestException('Goal does not exist.');
    }

    const progress = await this.goalsService.computeProgress(goal);
    return Object.assign(goal, { progress });
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req,
  ) {
    const goal = await this.goalsService.findOne(id);
    if (!goal) {
      throw new BadRequestException('Goal does not exist.');
    }

    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new UnauthorizedException('You have no access to update this goal');
    }

    return await this.goalsService.update(+id, updateGoalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const goal = await this.goalsService.findOne(id);
    if (!goal) {
      throw new BadRequestException('Goal does not exist.');
    }

    return await this.goalsService.remove(goal.id);
  }
}
