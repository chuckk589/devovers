import { IsOptional, IsDateString, Matches } from 'class-validator';

export class FindAppointmentsDto {
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Дата должна быть в формате YYYY-MM-DD',
  })
  start?: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Дата должна быть в формате YYYY-MM-DD',
  })
  end?: string;
}

