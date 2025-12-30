import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BlockedSlotsService } from './blocked-slots.service';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/blocked-slots')
@UseGuards(JwtAuthGuard)
export class BlockedSlotsController {
  constructor(private readonly blockedSlotsService: BlockedSlotsService) {}

  @Get()
  async findAll(@Query('date') date?: string) {
    if (date) {
      return this.blockedSlotsService.findByDate(date);
    }
    return this.blockedSlotsService.findAll();
  }

  @Post()
  async create(@Body() createBlockedSlotDto: CreateBlockedSlotDto) {
    return this.blockedSlotsService.create(createBlockedSlotDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.blockedSlotsService.remove(id);
    return { message: 'Блокировка успешно удалена' };
  }
}

