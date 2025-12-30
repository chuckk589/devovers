import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ScheduleConfigService } from './schedule-config.service';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/schedule-config')
@UseGuards(JwtAuthGuard)
export class ScheduleConfigController {
  constructor(private readonly scheduleConfigService: ScheduleConfigService) {}

  @Get()
  async getConfig() {
    return await this.scheduleConfigService.getConfig();
   
  }

  @Put()
  async updateConfig(@Body() updateDto: UpdateScheduleConfigDto) {
    return await this.scheduleConfigService.updateConfig(updateDto);
   
  }
}

