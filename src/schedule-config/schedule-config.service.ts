import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleConfig } from './entities/schedule-config.entity';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';

@Injectable()
export class ScheduleConfigService {
  constructor(
    @InjectRepository(ScheduleConfig)
    private scheduleConfigRepository: Repository<ScheduleConfig>,
  ) {}

  async getConfig(): Promise<ScheduleConfig> {
    let config = await this.scheduleConfigRepository.findOne({
      where: {},
    });

    if (!config) {
      config = this.scheduleConfigRepository.create({
        slotInterval: 2,
        startTime: '10:00',
        endTime: '18:00',
        hasLunchBreak: true,
        lunchStart: '13:00',
        lunchEnd: '14:00',
        workingDays: ['1', '2', '3', '4', '5'],
        availableDaysRange: 14,
        timezone: 'Europe/Moscow',
      });
      config = await this.scheduleConfigRepository.save(config);
    }

    return config;
  }

  async updateConfig(updateDto: UpdateScheduleConfigDto): Promise<ScheduleConfig> {
    let config = await this.scheduleConfigRepository.findOne({
      where: {},
    });

    if (!config) {
      config = this.scheduleConfigRepository.create({});
    }

    if (updateDto.slotInterval !== undefined) {
      config.slotInterval = updateDto.slotInterval;
    }
    if (updateDto.startTime !== undefined) {
      config.startTime = updateDto.startTime;
    }
    if (updateDto.endTime !== undefined) {
      config.endTime = updateDto.endTime;
    }
    if (updateDto.hasLunchBreak !== undefined) {
      config.hasLunchBreak = updateDto.hasLunchBreak;
    }
    if (updateDto.lunchStart !== undefined) {
      config.lunchStart = updateDto.lunchStart;
    }
    if (updateDto.lunchEnd !== undefined) {
      config.lunchEnd = updateDto.lunchEnd;
    }
    if (updateDto.workingDays !== undefined) {
      config.workingDays = updateDto.workingDays.map(String);
    }
    if (updateDto.availableDaysRange !== undefined) {
      config.availableDaysRange = updateDto.availableDaysRange;
    }
    if (updateDto.timezone !== undefined) {
      config.timezone = updateDto.timezone;
    }

    return this.scheduleConfigRepository.save(config);
  }
}

