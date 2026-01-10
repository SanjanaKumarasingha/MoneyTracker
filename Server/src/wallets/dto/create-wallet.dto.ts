import { ApiProperty, PickType } from '@nestjs/swagger';
import { Wallet } from '../entities/wallet.entity';

export class CreateWalletDto extends PickType(Wallet, ['name', 'currency']) {
  @ApiProperty({ type: 'number' })
  userId: number;
}
