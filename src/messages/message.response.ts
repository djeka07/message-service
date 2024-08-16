import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/user.entity';

import { MessageEntity, UserReadMessageEntity } from './messages.entity';

export class MessageUser {
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

export class ChatUserResponse {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  issued: number;
}

export class UserReadMessageResponse {
  @ApiProperty({ type: MessageUser })
  user: MessageUser;
  @ApiProperty()
  readAt: string;

  constructor(user: UserReadMessageEntity) {
    this.user = user.user;
    this.readAt = user.readAt;
  }
}

export class MessageReponse {
  @ApiProperty()
  messageId: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ type: MessageUser })
  from: MessageUser;

  @ApiProperty()
  message: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ isArray: true, type: UserReadMessageResponse })
  readBy: UserReadMessageResponse[];

  constructor(message: MessageEntity) {
    this.messageId = message.messageId;
    this.conversationId = message.conversation?.conversationId;
    this.from = new MessageUser(message.from);
    this.message = message.message;
    this.createdAt = message.createdAt;
    this.readBy =
      message.readBy?.map((r) => new UserReadMessageResponse(r)) || [];
  }
}
export class MessagesResponse {
  @ApiProperty({ type: [MessageReponse] })
  items: MessageReponse[];
  @ApiProperty()
  page: number;
  @ApiProperty()
  take: number;
  @ApiProperty()
  total: number;
  @ApiProperty()
  hasNextPage: boolean;
}
