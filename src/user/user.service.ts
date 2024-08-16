import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, In, Repository } from 'typeorm';
import { UserResponse } from './generated/user-client';
import { User } from './user.entity';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly loggerService: LokiLoggerService,
  ) {}

  async findAll({
    page,
    take,
  }: {
    page: number;
    take: number;
  }): Promise<{ total: number; users: User[]; page: number; take: number }> {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take,
    });

    return { total, users, page, take };
  }

  async findOneById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }
    return this.userRepository.findOneBy({ userId: id });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userRepository.find({ where: { userId: In(ids) } });
  }

  async findConversations(id: string): Promise<string[]> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.user_id=:id', { id })
      .loadAllRelationIds()
      .getOne();
    this.loggerService.log(user);
    return user?.conversations.map((c) => c as unknown as string) || [];
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.userRepository.delete(id);
  }

  async addOrUpdateUsers(users: UserResponse[]): Promise<User[]> {
    const createdUsers = await Promise.all(
      users.map((user) => this.addOrUpdate(user)),
    );
    return createdUsers;
  }

  async addOrUpdate(user: UserResponse): Promise<User> {
    const usr = (await this.findOneById(user?.id)) || new User();
    usr.email = user.email;
    usr.userId = user.id;
    usr.firstName = user.firstName;
    usr.lastName = user.lastName;
    usr.username = user.username;
    return this.save(usr);
  }

  async deleteOld(users: UserResponse[]): Promise<DeleteResult[]> {
    const usrs: User[] = [];
    let page = 1;
    const take = 10;
    let hasNextPage = true;

    while (hasNextPage) {
      const { total, users } = await this.findAll({ page, take });
      hasNextPage = page * take < total;
      page += 1;
      usrs.push(...users);
    }

    const deletedUsers = await Promise.all(
      usrs
        .filter((u) => !users.map((s) => s.id).includes(u.userId))
        .map(async (user) => {
          return this.delete(user.userId);
        }),
    );

    return deletedUsers;
  }
}
