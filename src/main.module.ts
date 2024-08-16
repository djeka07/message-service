import {
  LogLevel,
  LokiLoggerModule,
  LokiRequestLoggingInterceptor,
} from '@djeka07/nestjs-loki-logger';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { ConversationEntity } from './conversations/conversation.entity';
import { ConversationModule } from './conversations/conversation.module';
import { MessageEntity } from './messages/messages.entity';
import { MessagesModule } from './messages/messages.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { AzureServiceBusModule } from '@djeka07/nestjs-azure-service-bus';

@Module({
  imports: [
    AuthModule,
    ConversationModule,
    UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +(configService.get<number>('DB_PORT') as number),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [MessageEntity, User, ConversationEntity],
        autoLoadEntities: true,
        synchronize: true, // isDevelopment(),
        ssl: false,
        logger: 'advanced-console',
        logging: false,
      }),
      inject: [ConfigService],
    }),
    LokiLoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        app: 'chat-service',
        host: configService.get('LOGGING_HOST') as string,
        userId: configService.get('LOGGING_USER_ID') as string,
        password: configService.get('LOGGING_PASSWORD') as string,
        environment: process.env.NODE_ENV as 'development' | 'production',
        logLevel: LogLevel.info,
        logDev: false,
      }),
      inject: [ConfigService],
    }),
    AzureServiceBusModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connectionString: configService.get(
            'AZURE_SERVICE_BUS_CONNECTION_STRING',
          ) as string,
        };
      },
      inject: [ConfigService],
    }),
    MessagesModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LokiRequestLoggingInterceptor },
  ],
})
export class MainModule {}
