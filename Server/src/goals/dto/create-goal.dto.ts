import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Goal } from '../entities/goal.entity';

export class CreateGoalDto extends PickType(Goal, [
  'name',
  'type',
  'periodType',
  'targetAmount',
  'startDate',
  'endDate',
]) {
  @ApiProperty({ type: 'number' })
  userId: number;

  @ApiProperty({ type: 'number' })
  walletId: number;

  @ApiProperty({ type: 'number', required: false })
  @IsOptional()
  categoryId?: number;
}
