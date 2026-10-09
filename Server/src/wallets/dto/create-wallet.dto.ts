import { ApiProperty, PickType } from '@nestjs/swagger';
import { Wallet } from '../entities/wallet.entity';
import { IsNumber } from 'class-validator';

export class CreateWalletDto extends PickType(Wallet, ['name', 'currency']) {
  @ApiProperty({ type: 'number' })
  @IsNumber()
  userId: number;
}
