import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { UsersModule } from '../users/users.module';
import { OwnersModule } from '../owners/owners.module';
import { TelegramMessageService } from '../telegram/telegram-message.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Answer]), UsersModule, OwnersModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, TelegramMessageService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

