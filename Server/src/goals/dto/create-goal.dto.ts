import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
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
  @IsNumber()
  userId: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  walletId: number;

  @ApiProperty({ type: 'number', required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
