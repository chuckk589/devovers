import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UsersModule } from './users/users.module';
import { OwnersModule } from './owners/owners.module';
import { AuthModule } from './auth/auth.module';
import { BlockedSlotsModule } from './blocked-slots/blocked-slots.module';
import { ScheduleConfigModule } from './schedule-config/schedule-config.module';
import { QuestionsModule } from './questions/questions.module';
import { Appointment } from './appointments/entities/appointment.entity';
import { User } from './users/entities/user.entity';
import { Owner } from './owners/entities/owner.entity';
import { BlockedSlot } from './blocked-slots/entities/blocked-slot.entity';
import { ScheduleConfig } from './schedule-config/entities/schedule-config.entity';
import { Question } from './questions/entities/question.entity';
import { Answer } from './questions/entities/answer.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'devovers'),
        entities: [Appointment, User, Owner, BlockedSlot, ScheduleConfig, Question, Answer],
        synchronize: true, // В продакшене использовать миграции
      }),
      inject: [ConfigService],
    }),
    TelegramModule,
    AppointmentsModule,
    UsersModule,
    OwnersModule,
    AuthModule,
    BlockedSlotsModule,
    ScheduleConfigModule,
    QuestionsModule,
  ],
})
export class AppModule {}
