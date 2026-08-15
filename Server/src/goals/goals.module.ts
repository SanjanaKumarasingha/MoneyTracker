import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { Record } from '../records/entities/record.entity';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, Record]),
    UsersModule,
    WalletsModule,
    CategoriesModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
