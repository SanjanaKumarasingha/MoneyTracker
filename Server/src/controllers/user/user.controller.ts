// src/controllers/user.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { User } from '../../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() userData: Partial<User>): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Get(':email')
  findUserByEmail(@Param('email') email: string): Promise<User | undefined> {
    return this.userService.findUserByEmail(email);
  }
}
