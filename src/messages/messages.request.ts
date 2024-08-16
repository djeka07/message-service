import { ApiProperty } from '@nestjs/swagger';

export class FindAllByIdQuery {
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 10 })
  take: number;
  @ApiProperty({ required: true })
  id: string;
}

export class FindFromConversationIdQuery {
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 10 })
  take: number;
  @ApiProperty({ required: true })
  conversationId: string;
}

export class MessageRequest {
  conversationId: string;
  id: string;
}
