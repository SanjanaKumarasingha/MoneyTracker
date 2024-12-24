// src/controllers/user.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

    @Post()
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Get(':email')
  findUserByEmail(@Param('email') email: string): Promise<User | undefined> {
    return this.userService.findUserByEmail(email);
  }
}
