import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'src/app/helpers/array';
import { ConversationService } from 'src/conversations/conversation.service';
import { User } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { ConversationEntity } from '../conversations/conversation.entity';
import {
  CreateMessageRequest,
  ReadMessagesRequest,
} from '../conversations/conversation.request';
import { MessageEntity, UserReadMessageEntity } from './messages.entity';
import { FindFromConversationIdQuery } from './messages.request';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(UserReadMessageEntity)
    private readonly userReadMessageRepository: Repository<UserReadMessageEntity>,
    private readonly conversationService: ConversationService,
  ) {}

  async findById(id: string): Promise<MessageEntity | null> {
    return this.messageRepository.findOne({
      where: { messageId: id },
      relations: { conversation: true, readBy: { user: true }, from: true },
    });
  }

  async findByIds(ids: string[]): Promise<MessageEntity[]> {
    return this.messageRepository.find({
      where: { messageId: In(ids) },
      relations: { from: true, readBy: { user: true }, conversation: true },
    });
  }

  async findByConversationId({
    page,
    take,
    conversationId,
  }: FindFromConversationIdQuery): Promise<{
    items: MessageEntity[];
    total: number;
    hasNextPage: boolean;
  }> {
    const skip = (page - 1) * take;
    const [items, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where('message."conversationConversationId" = :conversationId', {
        conversationId,
      })
      .orderBy('message.createdAt', 'DESC')
      .leftJoinAndSelect('message.from', 'from')
      .leftJoinAndSelect('message.readBy', 'readBy')
      .leftJoinAndSelect('readBy.user', 'user')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items: items.reverse(), total, hasNextPage: page * take < total };
  }

  async createByConversation(
    conversation: ConversationEntity,
    fromUser: User,
    message: CreateMessageRequest,
  ): Promise<MessageEntity> {
    const messageEnity = new MessageEntity();
    messageEnity.from = fromUser;
    messageEnity.message = message.message;
    messageEnity.conversation = conversation;

    const savedMessage = await this.messageRepository.save(messageEnity);
    await this.conversationService.updateLastMessage(
      conversation.conversationId,
      messageEnity,
    );
    return savedMessage;
  }

  async updateRead(
    fromUser: User,
    readMessagesRequest: ReadMessagesRequest,
  ): Promise<MessageEntity[]> {
    if (isEmpty(readMessagesRequest.messageIds)) {
      return [];
    }

    const entities = await this.findByIds(readMessagesRequest.messageIds);

    let userReadEntities: UserReadMessageEntity[] = [];
    entities.forEach((entity) => {
      if (!entity.readBy.some((r) => r.user?.userId === fromUser.userId)) {
        const userReadMessageEntity = new UserReadMessageEntity();
        userReadMessageEntity.user = fromUser;
        userReadMessageEntity.message = entity;
        userReadMessageEntity.readAt = new Date().toISOString();
        userReadEntities = [...userReadEntities, userReadMessageEntity];
        entity.readBy = [...(entity.readBy || []), userReadMessageEntity];
      }
    });

    await Promise.all([
      this.userReadMessageRepository.save(userReadEntities),
      this.messageRepository.save(entities),
    ]);

    return entities;
  }
}
