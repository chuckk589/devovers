import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('schedule_config')
export class ScheduleConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 2 })
  slotInterval: number; // Интервал между слотами в часах

  @Column({ type: 'time', default: '10:00' })
  startTime: string; // Начало работы (формат: "HH:mm")

  @Column({ type: 'time', default: '18:00' })
  endTime: string; // Окончание работы (формат: "HH:mm")

  @Column({ type: 'boolean', default: true })
  hasLunchBreak: boolean; // Есть ли обеденный перерыв

  @Column({ type: 'time', nullable: true })
  lunchStart: string | null; // Начало обеда (формат: "HH:mm")

  @Column({ type: 'time', nullable: true })
  lunchEnd: string | null; // Конец обеда (формат: "HH:mm")

  @Column({ type: 'simple-array', default: '1,2,3,4,5' })
  workingDays: string[]; // Рабочие дни (0=воскресенье, 1=понедельник, ...)

  @Column({ type: 'int', default: 14 })
  availableDaysRange: number; // Количество дней вперед для доступных дат (по умолчанию 14)

  @Column({ type: 'varchar', length: 50, default: 'Europe/Moscow' })
  timezone: string; // Часовой пояс для бизнес-логики (IANA timezone, например 'Europe/Moscow')

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

