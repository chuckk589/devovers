import { IsUUID, IsNotEmpty } from 'class-validator';

export class LinkUserDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

