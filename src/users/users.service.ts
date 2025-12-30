import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createOrUpdate(telegramUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    is_bot?: boolean;
    language_code?: string;
  }): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { telegramId: telegramUser.id },
    });

    if (user) {
      user.username = telegramUser.username || user.username;
      user.firstName = telegramUser.first_name || user.firstName;
      user.lastName = telegramUser.last_name || user.lastName;
      return this.usersRepository.save(user);
    }

    user = this.usersRepository.create({
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
    });

    return this.usersRepository.save(user);
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { telegramId },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['appointments'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }


  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['appointments'],
      order: { createdAt: 'DESC' },
    });
  }
}

