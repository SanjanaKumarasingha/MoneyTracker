import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryType, IconName } from '../enums';

const defaultWalletCategories = [
  {
    name: 'Transportation',
    icon: IconName.BUS,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Restaurant',
    icon: IconName.RESTAURANT,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Health',
    icon: IconName.HEALTH,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Clothing',
    icon: IconName.SHIRT,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Shopping',
    icon: IconName.SHOPPING_CART,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Education',
    icon: IconName.GRADUATION,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Travel',
    icon: IconName.AIRPLANE,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Utils',
    icon: IconName.UTILS,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Bank',
    icon: IconName.BANK,
    type: CategoryType.INCOME,
  },
  {
    name: 'Income',
    icon: IconName.COIN,
    type: CategoryType.INCOME,
  },
];

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createWalletDto: CreateWalletDto, user: User) {
    const wallet = this.walletRepository.create({
      name: createWalletDto.name,
      currency: createWalletDto.currency,
      user: user,
      categoryOrder: [],
    });

    const savedWallet = await this.walletRepository.save(wallet);

    const categories = this.categoryRepository.create(
      defaultWalletCategories.map((category) => ({
        ...category,
        enable: true,
        wallet: savedWallet,
        user,
      })),
    );

    const savedCategories = await this.categoryRepository.save(categories);

    savedWallet.categoryOrder = savedCategories.map((category) => category.id);
    await this.walletRepository.save(savedWallet);

    return this.findOneForUser(savedWallet.id, user.id);
  }

  async findAll(userId: number) {
    const query = this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.records', 'records')
      .leftJoinAndSelect('records.category', 'category')
      .leftJoinAndSelect('wallet.categories', 'walletCategories')
      .leftJoin('wallet.user', 'user')
      .where('user.id = :id', { id: userId });

    return await query.getMany();
  }

  async findOne(id: number): Promise<Wallet> {
    const query = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.records', 'records')
      .leftJoinAndSelect('wallet.categories', 'walletCategories')
      .leftJoinAndSelect('wallet.user', 'user')
      .where('wallet.id = :id', { id });

    return await query.getOne();
  }

  async findOneForUser(id: number, userId: number): Promise<Wallet> {
    const query = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.records', 'records')
      .leftJoinAndSelect('records.category', 'category')
      .leftJoinAndSelect('wallet.categories', 'walletCategories')
      .leftJoinAndSelect('wallet.user', 'user')
      .where('wallet.id = :id', { id })
      .andWhere('user.id = :userId', { userId });

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

  async updateCategoryOrder(id: number, categoryOrder: number[]) {
    return await this.walletRepository.save({
      id,
      categoryOrder,
    });
  }
}
