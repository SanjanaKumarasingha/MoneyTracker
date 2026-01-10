import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
  ) {}

  async create(createWalletDto: CreateWalletDto, user: User) {
    const wallet = await this.walletRepository.create({
      name: createWalletDto.name,
      currency: createWalletDto.currency,
      user: user,
    });

    return await this.walletRepository.save(wallet);
  }

  async findAll(userId: number) {
    const query = this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.records', 'records')
      .leftJoinAndSelect('records.category', 'category')
      .leftJoin('wallet.user', 'user')
      .where('user.id = :id', { id: userId });

    return await query.getMany();
  }

  async findOne(id: number): Promise<Wallet> {
    const query = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.records', 'records')
      .where('wallet.id = :id', { id });

    return await query.getOne();
  }

  async update(id: number, updateWalletDto: UpdateWalletDto) {
    return await this.walletRepository.save({
      id: id,
      name: updateWalletDto.name,
      currency: updateWalletDto.currency,
    });
  }

  async remove(id: number) {
    return await this.walletRepository.softDelete(id);
  }
}
