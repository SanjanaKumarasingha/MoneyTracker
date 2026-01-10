import { PickType } from '@nestjs/swagger';
import { CreateWalletDto } from './create-wallet.dto';
import { Wallet } from '../entities/wallet.entity';

export class UpdateWalletDto extends PickType(Wallet, ['name', 'currency']) {}
