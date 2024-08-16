import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from 'src/messages/messages.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';

import { UserService } from '../user/user.service';
import { ConversationEntity } from './conversation.entity';
import {
  FindAllByUserId,
  FindConversationUsersRequest,
  HasAccessToConversationRequest,
} from './conversation.request';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly userService: UserService,
  ) {}

  async create(createdBy: User, users: User[]): Promise<ConversationEntity> {
    const entity = new ConversationEntity();
    entity.messages = [];
    entity.users = users;
    entity.admins = [createdBy];
    entity.createdBy = createdBy;
    return this.conversationRepository.save(entity);
  }
  async findAllByUserId({ userId, page, take }: FindAllByUserId) {
    const skip = (page - 1) * take;

    const conversationIds = await this.userService.findConversations(userId);

    if (conversationIds.length === 0) {
      return { items: [], total: 0, hasNextPage: false };
    }

    const [items, count] = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(
        `conversation.conversation_id IN (${conversationIds
          .map((u) => `'${u}'`)
          .join(', ')})`,
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .leftJoinAndSelect('conversation.users', 'users')
      .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
      .leftJoinAndSelect('lastMessage.from', 'from')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      items,
      total: count,
      hasNextPage: page * take < count,
    };
  }

  async findById(id: string) {
    return this.conversationRepository.findOne({
      where: { conversationId: id },
      relations: { users: true, admins: true, lastMessage: true },
    });
  }

  async hasAccess({
    id,
    userId,
  }: HasAccessToConversationRequest): Promise<boolean> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId: id },
      relations: { users: true },
    });

    return conversation?.users?.some((user) => user.userId === userId) || false;
  }

  async hasAdminAccess({
    id,
    userId,
  }: HasAccessToConversationRequest): Promise<boolean> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId: id },
      relations: { admins: true },
    });

    return (
      conversation?.admins?.some((user) => user.userId === userId) || false
    );
  }

  async findUsers({ id }: FindConversationUsersRequest): Promise<User[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId: id },
      relations: { users: true },
    });

    return conversation?.users || [];
  }

  async findAdmins({ id }: FindConversationUsersRequest): Promise<User[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId: id },
      relations: { admins: true },
    });

    return conversation?.admins || [];
  }

  async findByUserIds(userIds: string[]) {
    const conversations = await this.conversationRepository.find({
      relations: { users: true },
    });
    return conversations.find(
      (u) =>
        u.users
          .map((u) => u.userId)
          .sort()
          .join(',') === userIds.sort().join(','),
    );
  }

  async addAdmin(
    id: string,
    userId: string,
  ): Promise<ConversationEntity | null> {
    let conversation = await this.findById(id);
    if (!conversation) {
      return null;
    }
    const user = await this.userService.findOneById(userId);
    if (user) {
      conversation.admins = [...conversation.admins, user];
      conversation = await this.conversationRepository.save(conversation);
    }
    return conversation;
  }

  async addUsers(
    id: string,
    userIds: string[],
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(id);
    if (!conversation) {
      return null;
    }
    const users = await this.userService.findByIds(userIds);
    conversation.users = [...conversation.users, ...users];
    return this.conversationRepository.save(conversation);
  }

  async deleteUser(
    id: string,
    userId: string,
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(id);
    if (!conversation) {
      return null;
    }

    conversation.users = conversation.users.filter((u) => u.userId !== userId);
    conversation.admins = conversation?.admins?.filter(
      (a) => a.userId !== userId,
    );

    return this.conversationRepository.save(conversation);
  }

  async updateLastMessage(
    id: string,
    message: MessageEntity,
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(id);
    if (!conversation) {
      return null;
    }

    conversation.lastMessage = message;
    return this.conversationRepository.save(conversation);
  }
}
