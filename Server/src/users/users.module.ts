import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Category } from '../categories/entities/category.entity';
import { Record } from '../records/entities/record.entity';
import { Goal } from '../goals/entities/goal.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    ConfigModule,
    // Wallet/Category/Record/Goal are only used here for the cascading
    // soft-delete in deleteAccount() — repositories are injected directly
    // rather than importing WalletsModule/RecordsModule/GoalsModule, since
    // none of their own service logic is needed and doing so would risk
    // circular module imports (those modules already depend on Users for
    // ownership checks).
    TypeOrmModule.forFeature([User, Wallet, Category, Record, Goal]),
    forwardRef(() => CategoriesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
