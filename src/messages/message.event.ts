import { ApiProperty } from '@nestjs/swagger';
import { MessageReponse } from './message.response';

export class MessageCreatedEvent {
  @ApiProperty()
  message: MessageReponse;
  @ApiProperty()
  to: string[];
  @ApiProperty()
  from: string;

  constructor(message: MessageReponse, to: string[], from: string) {
    this.message = message;
    this.to = to;
    this.from = from;
  }
}

export class MessageReadEvent {
  @ApiProperty({ isArray: true, type: MessageReponse })
  messages: MessageReponse[];
  @ApiProperty()
  to: string[];
  @ApiProperty()
  from: string;

  constructor(messages: MessageReponse[], to: string[], from: string) {
    this.messages = messages;
    this.from = from;
    this.to = to;
  }
}
