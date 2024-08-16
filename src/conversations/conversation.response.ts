import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/user.entity';
import { UserResponse } from '../user/user.response';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from '../messages/messages.entity';

export class ConversionMessageResponse {
  @ApiProperty()
  messageId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  from: string;

  constructor(message: MessageEntity) {
    this.messageId = message.messageId;
    this.message = message.message;
    this.createdAt = message.createdAt;
    this.from = message?.from?.userId;
  }
}

export class ConversationResponse {
  @ApiProperty()
  conversationId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty()
  isGroup: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty({ required: false })
  lastMessage?: ConversionMessageResponse;
  @ApiProperty({ type: [UserResponse] })
  users: UserResponse[];
  @ApiProperty({ type: [UserResponse] })
  admins: UserResponse[];

  constructor(conversion: ConversationEntity) {
    this.conversationId = conversion.conversationId;
    this.name = conversion.name;
    this.createdAt = conversion.createdAt;
    this.lastMessage = conversion.lastMessage
      ? new ConversionMessageResponse(conversion.lastMessage)
      : undefined;
    this.isGroup = conversion.users?.length > 2;
    this.users = conversion.users?.map((user) => new UserResponse(user));
    this.admins = conversion.admins?.map((admin) => new UserResponse(admin));
  }
}

export class ConversationsResponse {
  @ApiProperty()
  total: number;
  @ApiProperty()
  hasNextPage: boolean;
  @ApiProperty()
  page: number;
  @ApiProperty()
  take: number;
  @ApiProperty({ type: [ConversationResponse] })
  items: ConversationResponse[];

  constructor(
    total: number,
    hasNextPage: boolean,
    page: number,
    take: number,
    items: ConversationEntity[],
  ) {
    this.total = total;
    this.hasNextPage = hasNextPage;
    this.page = page;
    this.take = take;
    this.items = items?.map((item) => new ConversationResponse(item));
  }
}

export class ConversationUserResponse {
  @ApiProperty({ type: [UserResponse] })
  users: UserResponse[];

  constructor(users: User[]) {
    this.users = users?.map((user) => new UserResponse(user));
  }
}
