import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from './entities/owner.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private ownersRepository: Repository<Owner>,
  ) {}

  async findByLogin(login: string): Promise<Owner | null> {
    return this.ownersRepository.findOne({
      where: { login },
    });
  }

  async findById(id: string): Promise<Owner> {
    const owner = await this.ownersRepository.findOne({
      where: { id },
    });

    if (!owner) {
      throw new NotFoundException(`Владелец с ID ${id} не найден`);
    }

    return owner;
  }

  async findAllWithUsers(): Promise<Owner[]> {
    return this.ownersRepository.find({
      relations: ['user'],
    });
  }

  async validateOwner(login: string, password: string): Promise<Owner> {
    const owner = await this.findByLogin(login);

    if (!owner) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, owner.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return owner;
  }
}

