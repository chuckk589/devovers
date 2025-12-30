import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.questionsService.findAll();
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard)
  async createAnswer(
    @Param('id') questionId: string,
    @Body() createAnswerDto: Omit<CreateAnswerDto, 'questionId'>,
    @Request() req,
  ) {
    return this.questionsService.createAnswer(
      { ...createAnswerDto, questionId },
      req.user.id,
    );
  }
}

