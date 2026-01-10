import { ApiProperty, PickType } from '@nestjs/swagger';
import { Record } from '../entities/record.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Category } from '../../categories/entities/category.entity';

export class CreateRecordDto extends PickType(Record, [
  'price',
  'remarks',
  'date',
]) {
  @ApiProperty({ type: () => Wallet })
  wallet: Wallet;

  @ApiProperty({ type: () => Category })
  category: Category;
}
