import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateOwnerPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

