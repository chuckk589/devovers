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
      .orderBy('blockedSlot.timeSlot', 'ASC')
      .getMany();
  }

  async findByDateRange(start: string, end: string): Promise<BlockedSlot[]> {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Неверный формат даты');
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return this.blockedSlotsRepository
      .createQueryBuilder('blockedSlot')
      .where("DATE(blockedSlot.date) >= DATE(:startDate)", { startDate: startStr })
      .andWhere("DATE(blockedSlot.date) <= DATE(:endDate)", { endDate: endStr })
      .orderBy('blockedSlot.date', 'ASC')
      .addOrderBy('blockedSlot.timeSlot', 'ASC')
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

