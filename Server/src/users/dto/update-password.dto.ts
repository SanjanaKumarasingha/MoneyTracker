import { PickType, ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UpdatePasswordDto extends PickType(User, [
  'id',
  'email',
  'username',
]) {
  @ApiProperty()
  oldPassword: string;

  @ApiProperty()
  newPassword: string;
}
