import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageEntity } from '../messages/messages.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'conversation' })
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'conversation_id',
  })
  conversationId: string;

  @Column({ default: '' })
  name: string;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @ManyToMany(() => User, (user) => user.conversations)
  @JoinColumn({ name: 'user_id' })
  users: User[];

  @ManyToMany(() => User, (user) => user.adminConversations)
  admins: User[];

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @OneToOne(() => MessageEntity, { nullable: true })
  @JoinColumn()
  lastMessage: MessageEntity;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;
}
