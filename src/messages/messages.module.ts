import { MessagesService } from './messages.service';
import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity, UserReadMessageEntity } from './messages.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ConversationService } from 'src/conversations/conversation.service';
import { ConversationEntity } from 'src/conversations/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      ConversationEntity,
      UserReadMessageEntity,
    ]),
    UserModule,
    AuthModule,
  ],
  providers: [MessagesService, ConversationService],
  exports: [MessagesService, TypeOrmModule.forFeature([MessageEntity])],
})
export class MessagesModule {}
