import { PickType } from '@nestjs/swagger';
import { Goal } from '../entities/goal.entity';

export class UpdateGoalDto extends PickType(Goal, [
  'name',
  'type',
  'periodType',
  'targetAmount',
  'startDate',
  'endDate',
]) {}
