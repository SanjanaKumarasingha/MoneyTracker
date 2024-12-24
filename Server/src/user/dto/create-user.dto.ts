// src/user/dto/create-user.dto.ts

import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6) // Optional: enforce minimum password length
  password: string;
}
