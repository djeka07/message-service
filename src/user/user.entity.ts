import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { UserReadMessageEntity } from 'src/messages/messages.entity';
import { ConversationEntity } from '../conversations/conversation.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn('uuid', {
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'username',
    nullable: false,
    unique: true,
    default: '',
  })
  username: string;

  @Column({ name: 'first_name', nullable: true, default: '' })
  firstName: string;

  @Column({ name: 'last_name', nullable: true, default: '' })
  lastName: string;

  @Column({
    name: 'email',
    unique: true,
    nullable: false,
    default: '',
  })
  email: string;

  @OneToMany(() => UserReadMessageEntity, (read) => read.user)
  readMessages: UserReadMessageEntity[];

  @ManyToMany(() => ConversationEntity, (conversation) => conversation.users)
  @JoinTable({
    name: 'user_conversation',
    joinColumn: {
      name: 'user',
      referencedColumnName: 'userId',
    },
    inverseJoinColumn: {
      name: 'conversation',
      referencedColumnName: 'conversationId',
    },
  })
  conversations: ConversationEntity[];

  @ManyToMany(() => ConversationEntity, (conversation) => conversation.admins)
  @JoinTable({
    name: 'admin_conversation',
    joinColumn: {
      name: 'user',
      referencedColumnName: 'userId',
    },
    inverseJoinColumn: {
      name: 'conversation',
      referencedColumnName: 'conversationId',
    },
  })
  adminConversations: ConversationEntity[];
}
