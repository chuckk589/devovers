import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: FindAppointmentsDto) {
    return this.appointmentsService.findAll(query.start, query.end);
  }

  @Get('available-slots')
  async getAvailableSlots(@Query() query: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(query.timestamp);
  }

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get('by-telegram/:telegramId')
  async findByTelegramId(@Param('telegramId') telegramId: string) {
    return this.appointmentsService.findByTelegramId(Number(telegramId));
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.appointmentsService.remove(id);
    return { message: 'Заявка успешно удалена' };
  }
}

