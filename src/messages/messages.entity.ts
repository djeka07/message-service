import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ConversationEntity } from '../conversations/conversation.entity';

@Entity({ name: 'message' })
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'message_id',
  })
  messageId: string;

  @OneToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn()
  from: User;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  conversation: ConversationEntity;

  @Column({ name: 'message', nullable: false })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @OneToMany(() => UserReadMessageEntity, (read) => read.message)
  @JoinTable()
  readBy: UserReadMessageEntity[];
}

@Entity({ name: 'user_read_message' })
export class UserReadMessageEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'read_id',
  })
  id: string;

  @ManyToOne(() => User, (user) => user.readMessages, {
    createForeignKeyConstraints: false,
  })
  user: User;

  @ManyToOne(() => MessageEntity, (message) => message.readBy, {
    createForeignKeyConstraints: false,
  })
  message: MessageEntity;

  @Column({ name: 'read_at' })
  readAt: string;
}
