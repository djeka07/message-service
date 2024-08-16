import { UserService } from './user.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserEvent } from './user.event';
import { HttpModule } from '@nestjs/axios';
import { UserTask } from './user.task';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HttpModule],
  controllers: [],
  providers: [UserService, UserTask, UserEvent],
  exports: [UserService],
})
export class UserModule {}
