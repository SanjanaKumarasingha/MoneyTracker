import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { attachTransferCategories } from '../records/transfer-category.util';

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

    const wallets = await query.getMany();
    // Transfer records (Record.isTransfer) have no real category — attach
    // a display-only synthetic one so every consumer of this endpoint
    // (RecordDataProvider's balance calc, Records.tsx's rendering, Mobile's
    // getWalletBalance, ...) keeps working without change. See
    // records/transfer-category.util.ts.
    wallets.forEach((wallet) => {
      wallet.records = attachTransferCategories(wallet.records ?? []);
    });

    return wallets;
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

  async belongsToUser(walletId: number, userId: number): Promise<boolean> {
    const count = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.user', 'user')
      .where('wallet.id = :walletId', { walletId })
      .andWhere('user.id = :userId', { userId })
      .getCount();

    return count > 0;
  }

  async getHiddenCategoryIds(walletId: number): Promise<number[]> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
      relations: ['hiddenCategories'],
    });

    return wallet?.hiddenCategories.map((category) => category.id) ?? [];
  }

  async setCategoryVisibility(
    walletId: number,
    categoryId: number,
    hidden: boolean,
  ): Promise<void> {
    const hiddenIds = await this.getHiddenCategoryIds(walletId);
    const isCurrentlyHidden = hiddenIds.includes(categoryId);

    if (hidden === isCurrentlyHidden) {
      return;
    }

    const relation = this.walletRepository
      .createQueryBuilder()
      .relation(Wallet, 'hiddenCategories')
      .of(walletId);

    if (hidden) {
      await relation.add(categoryId);
    } else {
      await relation.remove(categoryId);
    }
  }
}
