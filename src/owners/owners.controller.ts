import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerPasswordDto } from './dto/update-owner-password.dto';
import { LinkUserDto } from './dto/link-user.dto';

@Controller('api/owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

}

