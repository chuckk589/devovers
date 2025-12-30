import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleConfigController } from './schedule-config.controller';
import { ScheduleConfigService } from './schedule-config.service';
import { ScheduleConfig } from './entities/schedule-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleConfig])],
  controllers: [ScheduleConfigController],
  providers: [ScheduleConfigService],
  exports: [ScheduleConfigService],
})
export class ScheduleConfigModule {}

