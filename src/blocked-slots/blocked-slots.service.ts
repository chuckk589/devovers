import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedSlot } from './entities/blocked-slot.entity';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';

@Injectable()
export class BlockedSlotsService {
  constructor(
    @InjectRepository(BlockedSlot)
    private blockedSlotsRepository: Repository<BlockedSlot>,
  ) {}

  async create(createBlockedSlotDto: CreateBlockedSlotDto): Promise<BlockedSlot> {
    const date = new Date(createBlockedSlotDto.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Неверный формат даты');
    }

    const blockedSlot = this.blockedSlotsRepository.create({
      date,
      timeSlot: createBlockedSlotDto.timeSlot || undefined,
    });

    return this.blockedSlotsRepository.save(blockedSlot);
  }

  async findAll(): Promise<BlockedSlot[]> {
    return this.blockedSlotsRepository.find();
  }

  async findByDate(date: string): Promise<BlockedSlot[]> {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Неверный формат даты');
    }

    const dateStr = dateObj.toISOString().split('T')[0];
    
    return this.blockedSlotsRepository
      .createQueryBuilder('blockedSlot')
      .where("DATE(blockedSlot.date) = DATE(:date)", { date: dateStr })
      .orderBy('blockedSlot.startTime', 'ASC')
      .getMany();
  }

  async remove(id: string): Promise<void> {
    const blockedSlot = await this.blockedSlotsRepository.findOne({
      where: { id },
    });

    if (!blockedSlot) {
      throw new NotFoundException(`Блокировка с id ${id} не найдена`);
    }

    await this.blockedSlotsRepository.remove(blockedSlot);
  }
}

