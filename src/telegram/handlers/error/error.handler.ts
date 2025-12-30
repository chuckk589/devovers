import { Injectable, Logger } from '@nestjs/common';
import { Bot, GrammyError } from 'grammy';
import { ITelegramHandler } from '../interfaces/telegram-handler.interface';

/**
 * Bot error handler
 */
@Injectable()
export class ErrorHandler implements ITelegramHandler {
  private readonly logger = new Logger(ErrorHandler.name);

  register(bot: Bot): void {
    bot.catch((err) => {
      const ctx = err.ctx;
      const error = err.error as GrammyError;

      this.logger.error(
        `Error processing update ${ctx.update.update_id}: ${error.message}`,
        error.stack,
      );

      // Additional error handling logic can be added here
      // For example, sending notification to administrator
    });
  }
}

