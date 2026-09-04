import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Category } from '../categories/entities/category.entity';
import { Record } from '../records/entities/record.entity';
import { Goal } from '../goals/entities/goal.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCategoryOrderDto } from './dto/update-category-order';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  /**
   * Create User in the database
   * @param {CreateUserDto} createUserDto
   * @returns
   */
  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hash,
    }); 

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findByUsername(username): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.userRepository.save({
      id: id,
      username: updateUserDto.username,
      email: updateUserDto.email,
    });
  }

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto) {
    if (!(await bcrypt.compare(updatePasswordDto.oldPassword, user.password))) {
      throw new UnauthorizedException('Old password does not match');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(updatePasswordDto.newPassword, salt);

    return await this.userRepository.save({
      id: user.id,
      password: hash,
    });
  }

  async updateCategoryOrder(updateCategoryOrderDto: UpdateCategoryOrderDto) {
    return await this.userRepository.save({
      id: updateCategoryOrderDto.id,
      categoryOrder: updateCategoryOrderDto.categoryOrder,
    });
  }

  async delete(user: User) {
    return await this.userRepository.softDelete(user.id);
  }

  /**
   * Account deletion (Google Play Data Safety requirement): cascades the
   * same soft-delete every other entity in this app already uses (see
   * WalletsService.remove/CategoriesService.remove/etc.) down from the user
   * — records and goals scoped to the user's wallets, then the wallets and
   * categories themselves, then the user. Children are removed before their
   * parents so nothing is left pointing at an already-deleted row, even
   * though soft-delete doesn't enforce FK integrity the way a hard delete
   * would.
   */
  async deleteAccount(userId: number): Promise<void> {
    const wallets = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
    const walletIds = wallets.map((wallet) => wallet.id);

    if (walletIds.length > 0) {
      await this.recordRepository.softDelete({ wallet: { id: In(walletIds) } });
      await this.goalRepository.softDelete({ wallet: { id: In(walletIds) } });
      await this.walletRepository.softDelete({ id: In(walletIds) });
    }

    await this.categoryRepository.softDelete({ user: { id: userId } });
    await this.userRepository.softDelete(userId);
  }
}
