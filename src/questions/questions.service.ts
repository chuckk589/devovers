import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UsersService } from '../users/users.service';
import { OwnersService } from '../owners/owners.service';
import { TelegramMessageService } from '../telegram/telegram-message.service';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
    private usersService: UsersService,
    private ownersService: OwnersService,
    private telegramMessageService: TelegramMessageService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const user = await this.usersService.findByTelegramId(createQuestionDto.telegramId);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const question = this.questionsRepository.create({
      message: createQuestionDto.message,
      user: user,
    });

    const savedQuestion = await this.questionsRepository.save(question);

    // Отправляем уведомление всем админам в Telegram
    try {
      const owners = await this.ownersService.findAllWithUsers();
      const adminTelegramIds = owners
        .filter((owner) => owner.user && owner.user.telegramId)
        .map((owner) => owner.user!.telegramId);

      if (adminTelegramIds.length > 0) {
        const userName = user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь';
        await this.telegramMessageService.sendNewQuestionNotification(
          adminTelegramIds,
          userName,
          createQuestionDto.message,
        );
      }
    } catch (error) {
      // Логируем ошибку, но не прерываем выполнение
      this.logger.error(`Failed to send new question notifications to admins: ${error.message}`);
    }

    return savedQuestion;
  }

  async findAll(): Promise<Question[]> {
    return this.questionsRepository.find({
      relations: ['user', 'answers', 'answers.owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async createAnswer(createAnswerDto: CreateAnswerDto, ownerId: string): Promise<Answer> {
    const question = await this.questionsRepository.findOne({
      where: { id: createAnswerDto.questionId },
      relations: ['user'],
    });

    if (!question) {
      throw new NotFoundException('Вопрос не найден');
    }

    const owner = await this.ownersService.findById(ownerId);

    const answer = this.answersRepository.create({
      message: createAnswerDto.message,
      question: question,
      owner: owner,
    });

    const savedAnswer = await this.answersRepository.save(answer);

    // Отправляем уведомление пользователю в Telegram
    if (question.user && question.user.telegramId) {
      try {
        await this.telegramMessageService.sendAnswerNotification(
          question.user.telegramId,
          question.message,
          createAnswerDto.message,
        );
      } catch (error) {
        // Логируем ошибку, но не прерываем выполнение
        this.logger.error(`Failed to send Telegram notification to user ${question.user.telegramId}: ${error.message}`);
      }
    }

    return savedAnswer;
  }
}

