import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class CreateConversationRequest {
  @ApiProperty({
    required: true,
    description: 'Users that should be in the conversation',
  })
  userIds: string[];
  @ApiProperty({
    description: 'Message to be created when creating the conversation',
    required: false,
  })
  message: string;
}

export class FindAllByUserId {
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 10 })
  take: number;
  @ApiProperty({ required: true })
  userId: string;
}

export class FindConversationUsersRequest {
  @ApiProperty({ required: true })
  id: string;
}

export class HasAccessToConversationRequest {
  @ApiProperty({ required: true })
  id: string;
  @ApiProperty({ required: true })
  userId: string;
}

export class CreateMessageRequest {
  @ApiProperty()
  @IsNotEmpty()
  message: string;
}

export class ReadMessagesRequest {
  @ApiProperty()
  @IsNotEmpty()
  messageIds: string[];
}

export class AddConversationUsersRequest {
  @ApiProperty()
  @ArrayNotEmpty()
  userIds: string[];
}
