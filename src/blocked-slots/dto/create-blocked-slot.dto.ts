import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBlockedSlotDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  timeSlot?: string | null;
}

