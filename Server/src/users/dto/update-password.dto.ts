import { PickType, ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto extends PickType(User, [
  'id',
  'email',
  'username',
]) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
