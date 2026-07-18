import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { Record } from '../records/entities/record.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Category } from '../categories/entities/category.entity';
import { GoalType, CategoryType } from '../enums';
import { getCurrentPeriodWindow } from './goal-period.util';

export interface GoalProgress {
  periodStart: Date;
  periodEnd: Date;
  isActive: boolean;
  actual: number;
  remaining: number;
  percent: number;
  status: 'met' | 'in-progress' | 'exceeded' | 'within-limit';
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal) private readonly goalRepository: Repository<Goal>,
    @InjectRepository(Record)
    private readonly recordRepository: Repository<Record>,
  ) {}

  async create(
    createGoalDto: CreateGoalDto,
    user: User,
    wallet: Wallet,
    category: Category | null,
  ) {
    const goal = this.goalRepository.create({
      name: createGoalDto.name ?? null,
      type: createGoalDto.type,
      periodType: createGoalDto.periodType,
      targetAmount: createGoalDto.targetAmount,
      startDate: createGoalDto.startDate,
      endDate: createGoalDto.endDate ?? null,
      user,
      wallet,
      category,
    });

    return await this.goalRepository.save(goal);
  }

  async findAllByWallet(walletId: number) {
    return await this.goalRepository
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.wallet', 'wallet')
      .leftJoinAndSelect('goal.category', 'category')
      .where('wallet.id = :walletId', { walletId })
      .getMany();
  }

  async findOne(id: number) {
    return await this.goalRepository
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.wallet', 'wallet')
      .leftJoinAndSelect('goal.category', 'category')
      .where('goal.id = :id', { id })
      .getOne();
  }

  async update(id: number, updateGoalDto: UpdateGoalDto) {
    return await this.goalRepository.save({
      id,
      name: updateGoalDto.name ?? null,
      type: updateGoalDto.type,
      periodType: updateGoalDto.periodType,
      targetAmount: updateGoalDto.targetAmount,
      startDate: updateGoalDto.startDate,
      endDate: updateGoalDto.endDate ?? null,
    });
  }

  async remove(id: number) {
    return await this.goalRepository.softDelete(id);
  }

  // Sums SAVING goals against INCOME-type records and SPENDING_LIMIT goals
  // against EXPENSE-type records in scope, over the goal's current period
  // window — mirroring the existing Category.type EXPENSE/INCOME split used
  // for wallet balance elsewhere in the app.
  async computeProgress(
    goal: Goal,
    referenceDate: Date = new Date(),
  ): Promise<GoalProgress> {
    const { periodStart, periodEnd, isActive } = getCurrentPeriodWindow(
      goal,
      referenceDate,
    );

    const relevantType =
      goal.type === GoalType.SAVING ? CategoryType.INCOME : CategoryType.EXPENSE;

    // Bind as plain 'YYYY-MM-DD' strings, not Date objects — the mysql2
    // driver reinterprets Date parameters in the server's local timezone
    // before comparing against the DATE column, which silently shifts the
    // boundary by the UTC offset (e.g. +5:30) and can exclude same-day
    // records. A date-only string is compared as-is, with no conversion.
    const startDateOnly = periodStart.toISOString().slice(0, 10);
    const endDateOnly = periodEnd.toISOString().slice(0, 10);

    const query = this.recordRepository
      .createQueryBuilder('record')
      .leftJoin('record.wallet', 'wallet')
      .leftJoin('record.category', 'category')
      .where('wallet.id = :walletId', { walletId: goal.wallet.id })
      .andWhere('category.type = :type', { type: relevantType })
      .andWhere('record.date >= :start', { start: startDateOnly })
      .andWhere('record.date <= :end', { end: endDateOnly });

    if (goal.category) {
      query.andWhere('category.id = :categoryId', {
        categoryId: goal.category.id,
      });
    }

    const { total } = await query
      .select('COALESCE(SUM(record.price), 0)', 'total')
      .getRawOne<{ total: string }>();

    const actual = Number(total);
    const targetAmount = Number(goal.targetAmount);
    const percent = targetAmount > 0 ? (actual / targetAmount) * 100 : 0;
    const status: GoalProgress['status'] =
      goal.type === GoalType.SAVING
        ? actual >= targetAmount
          ? 'met'
          : 'in-progress'
        : actual > targetAmount
          ? 'exceeded'
          : 'within-limit';

    return {
      periodStart,
      periodEnd,
      isActive,
      actual,
      remaining: targetAmount - actual,
      percent,
      status,
    };
  }

  async findAllByWalletWithProgress(walletId: number) {
    const goals = await this.findAllByWallet(walletId);
    return await Promise.all(
      goals.map(async (goal) =>
        Object.assign(goal, { progress: await this.computeProgress(goal) }),
      ),
    );
  }
}
