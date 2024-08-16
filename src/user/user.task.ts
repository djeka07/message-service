import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthControllerClient,
  UserControllerClient,
} from './generated/user-client';
import { UserService } from './user.service';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
@Injectable()
export class UserTask {
  private userApiUrl: string;
  private apiUsername: string;
  private apiPassword: string;
  private apiAppUuid: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly loggerService: LokiLoggerService,
  ) {
    this.apiUsername = this.configService.get<string>(
      'API_USER_USERNAME',
    ) as string;
    this.apiPassword = this.configService.get<string>(
      'API_USER_PASSWORD',
    ) as string;
    this.apiAppUuid = this.configService.get<string>('API_APP_UUID') as string;
    this.userApiUrl = this.configService.get<string>('USER_API') as string;
  }

  private async login(): Promise<string> {
    const authClient = new AuthControllerClient(
      this.userApiUrl,
      axios.create(),
    );
    const authBody = {
      email: this.apiUsername,
      password: this.apiPassword,
      applicationId: this.apiAppUuid,
    };
    const token = await authClient.auth(authBody);

    return `${token?.type} ${token?.accessToken}`;
  }

  async syncUsers() {
    try {
      const token = await this.login();
      const userClient = new UserControllerClient(
        this.userApiUrl,
        axios.create({ headers: { authorization: token } }),
      );

      let page = 1;
      const take = 10;
      let hasNextPage = true;

      while (hasNextPage) {
        const { users, total } = await userClient.getUsers(
          undefined,
          page,
          take,
        );
        await this.userService.addOrUpdateUsers(users);
        hasNextPage = page * take < total;
        page += 1;
      }
      this.loggerService.info('Synced users');
    } catch (error) {
      this.loggerService.error('Could not sync users', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.syncUsers();
  }
}
