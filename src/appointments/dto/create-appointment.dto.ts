import { IsString, IsDateString, IsOptional, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsOptional()
  customService?: string;

  @IsString()
  @IsOptional()
  maintenanceInfo?: string;

  @IsString()
  @IsNotEmpty()
  carBrand: string;

  @IsString()
  @IsOptional()
  customCarBrand?: string;

  @IsString()
  @IsOptional()
  carModel?: string;

  @IsString()
  @IsOptional()
  carYear?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsNumber()
  telegramId: number;
}

