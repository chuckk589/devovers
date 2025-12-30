import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsOptional()
  questionId?: string; // Опционально, так как может браться из параметра URL
}

