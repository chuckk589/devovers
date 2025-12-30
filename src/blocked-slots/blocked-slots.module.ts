import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedSlotsController } from './blocked-slots.controller';
import { BlockedSlotsService } from './blocked-slots.service';
import { BlockedSlot } from './entities/blocked-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedSlot])],
  controllers: [BlockedSlotsController],
  providers: [BlockedSlotsService],
  exports: [BlockedSlotsService],
})
export class BlockedSlotsModule {}

