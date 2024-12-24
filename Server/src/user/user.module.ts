import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Register User entity here
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
