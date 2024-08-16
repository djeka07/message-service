import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export class UserResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  constructor(user: User) {
    this.userId = user.userId;
    this.username = user.username;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
  }
}
