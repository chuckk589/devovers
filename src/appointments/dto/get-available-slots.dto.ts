import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAvailableSlotsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  timestamp?: number;
}

