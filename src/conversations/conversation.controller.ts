import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ChatUserResponse,
  MessagesResponse,
} from '../messages/message.response';

import {
  AzureServiceBusClient,
  Emit,
  Emittable,
} from '@djeka07/nestjs-azure-service-bus';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { isEmpty } from 'src/app/helpers/array';
import { CurrentUser } from 'src/user/user.decorator';
import {
  MessageCreatedEvent,
  MessageReadEvent,
} from '../messages/message.event';
import { MessageReponse } from '../messages/message.response';
import { MessagesService } from '../messages/messages.service';
import { UserService } from '../user/user.service';
import {
  AddConversationUsersRequest,
  CreateConversationRequest,
  CreateMessageRequest,
  ReadMessagesRequest,
} from './conversation.request';
import {
  ConversationResponse,
  ConversationUserResponse,
  ConversationsResponse,
} from './conversation.response';
import { ConversationService } from './conversation.service';

@ApiTags('Conversations')
@Controller('api/v1/conversations')
@ApiBearerAuth()
@ApiExtraModels(ChatUserResponse)
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
    private readonly messageService: MessagesService,
    private readonly loggerService: LokiLoggerService,
    @Emittable('message_created')
    private readonly messageCreatedEmit: Emit,
    @Emittable('message_read')
    private readonly messageReadEmit: Emit,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiBody({ type: CreateConversationRequest })
  @ApiOkResponse({ type: ConversationResponse })
  @ApiOperation({
    summary: 'Create a new conversation',
    description: 'Create a new conversation with users and message.',
  })
  async createConversation(
    @CurrentUser('id') id: string,
    @Body() createRequest: CreateConversationRequest,
  ): Promise<ConversationResponse> {
    const users = await this.userService.findByIds([
      id,
      ...createRequest.userIds,
    ]);
    const user = await this.userService.findOneById(id);

    if (!user) {
      throw new NotFoundException('Could not find user');
    }

    const conversation = await this.conversationService.create(user, users);

    if (!!createRequest.message) {
      await this.messageService.createByConversation(
        conversation,
        user,
        createRequest,
      );
    }
    return new ConversationResponse(conversation);
  }
  @Get()
  @ApiOkResponse({ type: ConversationsResponse })
  @ApiQuery({
    name: 'take',
    type: Number,
    example: 10,
    required: false,
    description: 'How many items to take, defaults to 10',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    example: 1,
    required: false,
    description: 'The page number for pagination, defaults to 1',
  })
  @ApiOperation({
    summary: 'Get conversations from the logged in user',
    description: 'Get conversations from the logged in user',
  })
  async getUserConversations(
    @CurrentUser('id') id: string,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page,
  ): Promise<ConversationsResponse> {
    const { total, items, hasNextPage } =
      await this.conversationService.findAllByUserId({
        userId: id,
        page,
        take,
      });

    return new ConversationsResponse(total, hasNextPage, page, take, items);
  }
  @Get('/users')
  @ApiOperation({
    description: 'Get a conversation from users',
    summary: 'Get a conversation from users',
  })
  @ApiOkResponse({ type: ConversationResponse })
  @ApiNotFoundResponse()
  @ApiQuery({
    name: 'userIds',
    type: [String],
    required: true,
    description: 'The users to get conversation from',
  })
  async getConversationFromUsers(
    @CurrentUser('id') id: string,
    @Query('userIds', new ParseArrayPipe({ items: String, separator: ',' }))
    userIds: string[],
  ): Promise<ConversationResponse> {
    if (isEmpty(userIds)) {
      throw new BadRequestException('No users ids provided');
    }

    const ids = [id, ...userIds];
    const conversation = await this.conversationService.findByUserIds(ids);
    if (!conversation) {
      throw new NotFoundException();
    }
    return new ConversationResponse(conversation);
  }

  @Get('/:id')
  @ApiOkResponse({ type: ConversationResponse })
  @ApiNotFoundResponse()
  @ApiOperation({
    summary: 'Get conversation by id',
    description: 'Get conversation by id',
  })
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ConversationResponse> {
    const hasAccess = await this.conversationService.hasAccess({
      id,
      userId,
    });
    if (!hasAccess) {
      throw new BadRequestException();
    }

    const response = await this.conversationService.findById(id);
    if (!response) {
      throw new NotFoundException(`Could not find conversation with id ${id}`);
    }
    return new ConversationResponse(response);
  }

  @Get('/:id/messages')
  @ApiOkResponse({ type: MessagesResponse })
  @ApiBadRequestResponse()
  @ApiOperation({
    summary: 'Get messages from a conversation',
    description: 'Get messages from a conversation',
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    required: false,
    description: 'How many messages to take, defaults to 10',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination, defaults to 1',
  })
  async getConversationMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page,
  ): Promise<MessagesResponse> {
    const hasAccess = await this.conversationService.hasAccess({
      id,
      userId,
    });
    if (!hasAccess) {
      throw new BadRequestException();
    }

    const { items, total, hasNextPage } =
      await this.messageService.findByConversationId({
        conversationId: id,
        page,
        take,
      });

    return {
      items: items?.map((item) => new MessageReponse(item)),
      total,
      page,
      take,
      hasNextPage,
    };
  }

  @Get('/:id/users')
  @ApiOperation({
    summary: 'Get the users from a conversation',
    description: 'Get the users from a conversation',
  })
  @ApiOkResponse({ type: ConversationUserResponse })
  @ApiBadRequestResponse()
  async getConversationUsers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ConversationUserResponse> {
    const hasAccess = await this.conversationService.hasAccess({
      id,
      userId,
    });
    if (!hasAccess) {
      throw new BadRequestException();
    }

    const users = await this.conversationService.findUsers({
      id,
    });

    return new ConversationUserResponse(users);
  }

  @Post('/:id/users')
  @ApiOkResponse({ type: ConversationResponse })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @ApiOperation({
    summary: 'Add users to a conversation',
    description:
      'Add users to a conversation. The conversation already needs to be a group meaning you cant add users to an one on one conversation. Current user must be an admin.',
  })
  async addConversationUsers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body()
    request: AddConversationUsersRequest,
  ) {
    const { userIds } = request;
    const hasAdminAccess = await this.conversationService.hasAdminAccess({
      id,
      userId,
    });

    if (!hasAdminAccess) {
      throw new BadRequestException('Only admins can add users');
    }

    const conversationUsers = await this.conversationService.findUsers({ id });
    if (conversationUsers?.some((user) => userIds.includes(user.userId))) {
      throw new BadRequestException(
        'Cant add users that is already in the conversation',
      );
    }

    if (conversationUsers.length <= 2) {
      throw new BadRequestException(
        'Cant add users to a conversation thats is not a group',
      );
    }
    const response = await this.conversationService.addUsers(id, userIds);

    if (!response) {
      throw new NotFoundException(`Could not find conversation with id ${id}`);
    }

    return new ConversationResponse(response);
  }

  @Put('/:id/admins/:userId')
  @ApiOperation({
    summary: 'Add an admin to the conversation.',
    description:
      'Add admin to the conversation. The admin added must be a user in the conversation.',
  })
  @ApiOkResponse({ type: ConversationResponse })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async addConversationAdmins(
    @CurrentUser('id') currentUserId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const hasAdminAccess = await this.conversationService.hasAdminAccess({
      id,
      userId: currentUserId,
    });

    if (!hasAdminAccess) {
      throw new BadRequestException('No admin access to the conversation');
    }

    const conversation = await this.conversationService.findById(id);

    if (!conversation) {
      throw new NotFoundException(`Could not find conversation with id ${id}`);
    }

    if (!conversation.users.some((user) => user.userId === userId)) {
      throw new BadRequestException(
        'Cant add users that is not in the conversation',
      );
    }

    if (conversation?.admins?.some((user) => user.userId === userId)) {
      throw new BadRequestException(
        'Cant add admins that is already admins in the conversation',
      );
    }

    const response = await this.conversationService.addAdmin(id, userId);
    return new ConversationResponse(response!);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({
    summary: 'Remove a user from a conversation',
    description: 'Remove a user from a conversation',
  })
  @ApiOkResponse({ type: ConversationResponse })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async removeConversationUser(
    @CurrentUser('id') currentUserId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const hasAdminAccess = await this.conversationService.hasAdminAccess({
      id,
      userId: currentUserId,
    });

    if (!hasAdminAccess) {
      throw new BadRequestException('You must be an admin to remove users');
    }

    const response = await this.conversationService.deleteUser(id, userId);
    if (!response) {
      throw new NotFoundException(`Could not find conversation with id ${id}`);
    }
    return new ConversationResponse(response);
  }

  @Post('/:id/messages')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Create a message',
    description: 'Create a message',
  })
  @ApiBody({ type: CreateMessageRequest })
  @ApiOkResponse({ type: MessageReponse })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async createMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() message: CreateMessageRequest,
  ): Promise<MessageReponse> {
    const hasAccess = await this.conversationService.hasAccess({
      id,
      userId,
    });
    if (!hasAccess) {
      throw new BadRequestException();
    }
    const [conversation, user] = await Promise.all([
      this.conversationService.findById(id),
      this.userService.findOneById(userId),
    ]);

    if (!conversation) {
      throw new NotFoundException(`Could not find conversation with id ${id}`);
    }

    const createdMessage = await this.messageService.createByConversation(
      conversation,
      user!,
      message,
    );

    const messageResponse = new MessageReponse(createdMessage);
    this.messageCreatedEmit({
      payload: {
        body: new MessageCreatedEvent(
          messageResponse,
          conversation.users.map((u) => u.userId),
          userId,
        ),
      },
    });

    return messageResponse;
  }

  @Put('/:id/messages/read')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update a message read status',
    description: 'Update a message read status',
  })
  @ApiBadRequestResponse()
  @ApiBody({ type: CreateMessageRequest })
  @ApiOkResponse({ type: MessageReponse })
  async readMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() messageRequest: ReadMessagesRequest,
  ): Promise<MessageReponse[]> {
    const hasAccess = await this.conversationService.hasAccess({
      id,
      userId,
    });
    if (!hasAccess) {
      throw new BadRequestException();
    }
    const [user, users] = await Promise.all([
      this.userService.findOneById(userId),
      this.conversationService.findUsers({ id }),
    ]);
    const messages = await this.messageService.updateRead(
      user!,
      messageRequest,
    );

    const response = messages.map((message) => new MessageReponse(message));
    this.messageReadEmit({
      payload: {
        body: new MessageReadEvent(
          response,
          users.map((u) => u.userId),
          userId,
        ),
      },
    });

    return response;
  }
}
