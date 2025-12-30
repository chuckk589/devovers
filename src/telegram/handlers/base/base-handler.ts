import { Logger } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { ITelegramHandler } from '../interfaces/telegram-handler.interface';

/**
 * Base class for all handlers
 */
export abstract class BaseHandler implements ITelegramHandler {
  protected readonly logger: Logger;

  constructor(protected readonly handlerName: string) {
    this.logger = new Logger(handlerName);
  }

  /**
   * Abstract method for handler registration
   */
  abstract register(bot: Bot): void;

  /**
   * Protected method for safe error handling
   */
  protected async handleWithError(
    ctx: Context,
    handler: () => Promise<void> | void,
  ): Promise<void> {
    try {
      await handler();
    } catch (error) {
      this.logger.error(`Error in handler ${this.handlerName}: ${error.message}`, error.stack);
      await ctx.reply('Произошла ошибка при обработке запроса. Попробуйте позже.');
    }
  }
}

