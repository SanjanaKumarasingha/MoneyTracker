import { PickType } from '@nestjs/swagger';
import { Wallet } from '../entities/wallet.entity';

export class UpdateWalletCategoryOrderDto extends PickType(Wallet, [
  'id',
  'categoryOrder',
]) {}
