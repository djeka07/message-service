import { ConversationController } from './conversation.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './conversation.entity';
import { ConversationService } from './conversation.service';
import { UserModule } from '../user/user.module';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { AzureServiceBusModule } from '@djeka07/nestjs-azure-service-bus';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ConversationEntity]),
    UserModule,
    MessagesModule,
    AzureServiceBusModule.forFeature([
      { name: 'message_created' },
      { name: 'message_read' },
    ]),
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
