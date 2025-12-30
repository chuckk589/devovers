import { IsNumber, IsString, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';

export class UpdateScheduleConfigDto {
  @IsNumber()
  @Min(1)
  @Max(8)
  @IsOptional()
  slotInterval?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  hasLunchBreak?: boolean;

  @IsString()
  @IsOptional()
  lunchStart?: string | null;

  @IsString()
  @IsOptional()
  lunchEnd?: string | null;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  workingDays?: number[];

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  availableDaysRange?: number;

  @IsString()
  @IsOptional()
  timezone?: string;
}

