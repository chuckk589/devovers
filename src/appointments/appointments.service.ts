import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { BlockedSlot } from '../blocked-slots/entities/blocked-slot.entity';
import { ScheduleConfig } from '../schedule-config/entities/schedule-config.entity';
import { ScheduleConfigService } from '../schedule-config/schedule-config.service';
import { DateTimeZoneUtil } from '../utils/date-timezone.util';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(BlockedSlot)
    private blockedSlotsRepository: Repository<BlockedSlot>,
    private scheduleConfigService: ScheduleConfigService,
    private usersService: UsersService,
  ) {
    // this.getAvailableSlots().then(slots => {
    //   console.log(slots);
    // });
    this.getAvailableSlots()
  }

  /**
   * Преобразует дату (Date, string или другой формат) в строку формата YYYY-MM-DD
   * Использует указанный часовой пояс для корректного форматирования
   */
  private formatDateToString(date: Date | string, timezone: string): string {
    if (typeof date === 'string') {
      // Если строка уже в формате YYYY-MM-DD, возвращаем её
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Пытаемся извлечь дату из строки
      const match = date.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return match[1];
      }
      // Парсим дату и конвертируем в нужный часовой пояс
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return DateTimeZoneUtil.toDateString(dateObj, timezone);
      }
      return date;
    }
    if (date instanceof Date) {
      return DateTimeZoneUtil.toDateString(date, timezone);
    }
    // Fallback: пытаемся преобразовать в Date
    const dateObj = new Date(date as any);
    if (!isNaN(dateObj.getTime())) {
      return DateTimeZoneUtil.toDateString(dateObj, timezone);
    }
    throw new Error(`Не удалось преобразовать дату: ${date}`);
  }

  async getAvailableSlots(timestamp?: number) {
    const config = await this.scheduleConfigService.getConfig();
    const workingDays = config.workingDays.map(Number);
    const timezone = config.timezone || 'UTC';

    // Получаем "сегодня" в нужном часовом поясе
    const today = DateTimeZoneUtil.getToday(timezone);

    let datesToProcess: Date[] = [];

    if (timestamp) {
      // Если передан timestamp - обрабатываем только эту дату
      const date = DateTimeZoneUtil.normalizeToStartOfDay(timestamp, timezone);
      datesToProcess = [date];
    } else {
      // Если timestamp не передан - обрабатываем весь диапазон availableDaysRange
      const endDate = DateTimeZoneUtil.addDays(today, config.availableDaysRange, timezone);

      const currentDate = new Date(today);
      const endDateObj = new Date(endDate);
      while (currentDate <= endDateObj) {
        datesToProcess.push(new Date(currentDate));
        currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Фильтруем только рабочие дни (проверяем день недели в нужном часовом поясе)
    datesToProcess = datesToProcess.filter((date) => {
      const dayOfWeek = DateTimeZoneUtil.getDayOfWeek(date, timezone);
      return workingDays.includes(dayOfWeek);
    });

    if (datesToProcess.length === 0) {
      return [];
    }

    // Получаем все даты в виде строк для запросов (в нужном часовом поясе)
    const dateStrings = datesToProcess.map((d) => DateTimeZoneUtil.toDateString(d, timezone));
    const startDate = dateStrings[0];
    const endDate = dateStrings[dateStrings.length - 1];

    // Загружаем все заблокированные слоты и записи для диапазона дат
    const [blockedSlots, appointments] = await Promise.all([
      this.blockedSlotsRepository
        .createQueryBuilder('blockedSlot')
        .where("DATE(blockedSlot.date) >= DATE(:startDate)", { startDate })
        .andWhere("DATE(blockedSlot.date) <= DATE(:endDate)", { endDate })
        .getMany(),
      this.appointmentsRepository
        .createQueryBuilder('appointment')
        .where("DATE(appointment.appointmentDate) >= DATE(:startDate)", { startDate })
        .andWhere("DATE(appointment.appointmentDate) <= DATE(:endDate)", { endDate })
        .andWhere('appointment.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
        .getMany(),
    ]);

    // Группируем заблокированные слоты и записи по датам
    const blockedSlotsByDate = new Map<string, BlockedSlot[]>();
    const appointmentsByDate = new Map<string, Appointment[]>();

    blockedSlots.forEach((blockedSlot) => {
      const dateStr = this.formatDateToString(blockedSlot.date as any, timezone);
      if (!blockedSlotsByDate.has(dateStr)) {
        blockedSlotsByDate.set(dateStr, []);
      }
      blockedSlotsByDate.get(dateStr)!.push(blockedSlot);
    });

    appointments.forEach((appointment) => {
      const dateStr = this.formatDateToString(appointment.appointmentDate as any, timezone);
      if (!appointmentsByDate.has(dateStr)) {
        appointmentsByDate.set(dateStr, []);
      }
      appointmentsByDate.get(dateStr)!.push(appointment);
    });

    // Генерируем слоты для каждой даты
    const allSlots: Array<{
      date: string;
      time: string;
      displayTime: string;
      isBooked: boolean;
      isBlocked: boolean;
      status: 'available' | 'booked' | 'blocked';
    }> = [];

    const slots = this.generateSlots(config);

    datesToProcess.forEach((date) => {
      const dateStr = DateTimeZoneUtil.toDateString(date, timezone);
      const blockedSlotsForDate = blockedSlotsByDate.get(dateStr) || [];
      const appointmentsForDate = appointmentsByDate.get(dateStr) || [];
      const bookedTimeSlots = new Set(appointmentsForDate.map((a) => a.timeSlot));
      slots.forEach((slot, index) => {
        const isBlocked = this.isSlotBlocked(slot, blockedSlotsForDate);
        const isBooked = this.isSlotBooked(slot, appointmentsForDate);

        let status: 'available' | 'booked' | 'blocked' = 'available';
        if (isBlocked) {
          status = 'blocked';
        } else if (isBooked) {
          status = 'booked';
        }

        allSlots.push({
          date: dateStr,
          time: slot,
          displayTime: slot,
          isBooked,
          isBlocked,
          status,
        });
      });
    });

    return allSlots;
  }

  private generateSlots(config: ScheduleConfig): string[] {
    const slots: string[] = [];

    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const intervalMinutes = config.slotInterval * 60;

    let lunchStartMinutes: number | null = null;
    let lunchEndMinutes: number | null = null;

    if (config.hasLunchBreak && config.lunchStart && config.lunchEnd) {
      const [lunchStartHour, lunchStartMin] = config.lunchStart.split(':').map(Number);
      const [lunchEndHour, lunchEndMin] = config.lunchEnd.split(':').map(Number);
      lunchStartMinutes = lunchStartHour * 60 + lunchStartMin;
      lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;
    }

    let currentMinutes = startMinutes;

    while (currentMinutes < endMinutes) {
      if (lunchStartMinutes !== null && lunchEndMinutes !== null &&
        currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
        currentMinutes = lunchEndMinutes;
        continue;
      }

      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      slots.push(timeString);

      currentMinutes += intervalMinutes;
    }

    return slots;
  }

  private isSlotBlocked(slotTime: string, blockedSlots: BlockedSlot[]): boolean {
    const slotTimeWithSeconds = slotTime + ':00';
    return blockedSlots.some(bs => bs.timeSlot === slotTimeWithSeconds);
  }
  private isSlotBooked(slotTime: string, appointments: Appointment[]): boolean {
    const slotTimeWithSeconds = slotTime + ':00';
    return appointments.some(a => a.timeSlot === slotTimeWithSeconds);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      relations: ['user'],
      order: { appointmentDate: 'DESC', timeSlot: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByTelegramId(telegramId: number): Promise<Appointment[]> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return [];
    }
    return this.appointmentsRepository.find({
      where: { user: { id: user.id } },
      order: { appointmentDate: 'DESC', timeSlot: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Запись с ID ${id} не найдена`);
    }
    return appointment;
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = status;
    return this.appointmentsRepository.save(appointment);
  }

  async cancel(id: string): Promise<Appointment> {
    return this.updateStatus(id, AppointmentStatus.CANCELLED);
  }

  private async generateFancyID(): Promise<string> {
    const year = new Date().getFullYear();
    let fancyID: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Генерируем случайный ID до тех пор, пока не найдем уникальный
    while (!isUnique && attempts < maxAttempts) {
      // Генерируем случайную строку из 6 символов (цифры и заглавные буквы)
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randomString = '';
      for (let i = 0; i < 6; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      fancyID = `APP-${year}-${randomString}`;
      
      // Проверяем уникальность
      const existing = await this.appointmentsRepository.findOne({
        where: { fancyID },
      });
      
      if (!existing) {
        isUnique = true;
      }
      
      attempts++;
    }

    if (!isUnique) {
      // Если не удалось сгенерировать уникальный ID за maxAttempts попыток,
      // добавляем timestamp для гарантии уникальности
      const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
      fancyID = `APP-${year}-${timestamp}`;
    }

    return fancyID!;
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const config = await this.scheduleConfigService.getConfig();
    const timezone = config.timezone || 'UTC';

    // Преобразуем дату в правильный формат
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    const dateStr = DateTimeZoneUtil.toDateString(appointmentDate, timezone);

    // Проверяем, что слот доступен
    const availableSlots = await this.getAvailableSlots(appointmentDate.getTime());
    const slotAvailable = availableSlots.some(
      (slot) => slot.date === dateStr && slot.time === createAppointmentDto.timeSlot && slot.status === 'available',
    );

    if (!slotAvailable) {
      throw new BadRequestException('Выбранный слот недоступен для бронирования');
    }

    const user = await this.usersService.findByTelegramId(createAppointmentDto.telegramId);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Генерируем fancyID
    const fancyID = await this.generateFancyID();

    // Создаем appointment
    // Если customCarBrand указан, используем его как carBrand
    const carBrand = createAppointmentDto.customCarBrand || createAppointmentDto.carBrand;

    const appointment = this.appointmentsRepository.create({
      fancyID,
      serviceId: createAppointmentDto.serviceId,
      customService: createAppointmentDto.customService,
      maintenanceInfo: createAppointmentDto.maintenanceInfo,
      carBrand: carBrand,
      customCarBrand: createAppointmentDto.customCarBrand,
      carModel: createAppointmentDto.carModel,
      carYear: createAppointmentDto.carYear,
      licensePlate: createAppointmentDto.licensePlate,
      appointmentDate: appointmentDate,
      timeSlot: createAppointmentDto.timeSlot,
      clientName: createAppointmentDto.clientName,
      clientPhone: createAppointmentDto.clientPhone,
      comment: createAppointmentDto.comment,
      status: createAppointmentDto.status || AppointmentStatus.PENDING,
      user: user,
    });

    return this.appointmentsRepository.save(appointment);
  }
}

