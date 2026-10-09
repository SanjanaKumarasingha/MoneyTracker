import { ApiProperty, PickType } from '@nestjs/swagger';
import { Record } from '../entities/record.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Category } from '../../categories/entities/category.entity';
import { IsObject } from 'class-validator';

export class CreateRecordDto extends PickType(Record, [
  'price',
  'remarks',
  'date',
]) {
  // Only `.id` is read (RecordsService.create) - checked against the
  // caller's own wallets/categories in RecordsController.create.
  @ApiProperty({ type: () => Wallet })
  @IsObject()
  wallet: Wallet;

  @ApiProperty({ type: () => Category })
  @IsObject()
  category: Category;
}
