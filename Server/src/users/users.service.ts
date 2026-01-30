import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCategoryOrderDto } from './dto/update-category-order';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}
