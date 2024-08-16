import { Injectable } from '@nestjs/common';

import {
  AzureServiceBusMessage,
  Subscribe,
} from '@djeka07/nestjs-azure-service-bus';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { UserResponse } from './generated/user-client';
import { UserService } from './user.service';

@Injectable()
export class UserEvent {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: LokiLoggerService,
  ) {}

  @Subscribe({
    name: 'user_updated',
    subscription: 'chat-service',
  })
  public async handleUpdatedUser(
    data: AzureServiceBusMessage<UserResponse>,
  ): Promise<any> {
    await this.userService.addOrUpdate(data.body);
  }

  @Subscribe({
    name: 'user_deleted',
    subscription: 'chat-service',
  })
  public async handleDeletedUser(
    data: AzureServiceBusMessage<UserResponse>,
  ): Promise<any> {
    const user = await this.userService.findOneById(data?.body?.id);
    if (!!user) {
      await this.userService.delete(user.userId);
      this.loggerService.info(`Deleted user with id ${user.userId}`);
      return;
    }
    this.loggerService.info(
      `Could not find any user with id ${data?.body?.id}`,
    );
  }

  @Subscribe({ name: 'user_created', subscription: 'chat-service' })
  public async handleCreatedUser(data: AzureServiceBusMessage<UserResponse>) {
    try {
      await this.userService.addOrUpdate(data.body);
      this.loggerService.info(`User created/updated with id: ${data.body.id}`);
    } catch (error) {
      this.loggerService.error('Error on create/update user event', error);
    }
  }
}
