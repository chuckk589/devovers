import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  telegramId: number;
}

