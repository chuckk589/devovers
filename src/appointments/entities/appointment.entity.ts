import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  fancyID: string;

  @Column({ type: 'varchar', length: 255 })
  serviceId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customService: string;

  @Column({ type: 'text', nullable: true })
  maintenanceInfo: string;

  @Column({ type: 'varchar', length: 100 })
  carBrand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  carModel: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  carYear: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  licensePlate: string;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time' })
  timeSlot: string; // Формат: "09:00", "11:00", "14:00"

  @ManyToOne(() => User, (user) => user.appointments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50, nullable: true })
  clientPhone: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


