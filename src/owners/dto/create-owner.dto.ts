import { IsString, IsNotEmpty, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  login: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

