import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDto extends PickType(User, ['username', 'email']) {
  // Declared here rather than picked from User: the entity's
  // @Exclude({ toPlainOnly: true }) (which keeps the hash out of responses)
  // would otherwise make the whitelisting ValidationPipe strip the password
  // from the incoming request body too.
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  password: string;
}
