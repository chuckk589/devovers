import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { ITelegramHandler } from './interfaces/telegram-handler.interface';
import { StartHandler } from './commands/start.handler';
import { TextMessageHandler } from './messages/text-message.handler';
import { ErrorHandler } from './error/error.handler';
import { ServiceInfoCallbackHandler } from './callbacks/service-info.callback';

/**
 * Service for registering all handlers
 */
@Injectable()
export class HandlersRegistryService {
  private readonly logger = new Logger(HandlersRegistryService.name);
  private readonly handlers: ITelegramHandler[];

  constructor(
    private readonly startHandler: StartHandler,
    private readonly textMessageHandler: TextMessageHandler,
    private readonly serviceInfoCallbackHandler: ServiceInfoCallbackHandler,
    private readonly errorHandler: ErrorHandler,
  ) {
    // Register all handlers
    this.handlers = [
      this.startHandler,
      this.textMessageHandler,
      this.serviceInfoCallbackHandler,
      this.errorHandler,
    ];
  }

  /**
   * Registers all handlers in the bot
   * @param bot - Grammy bot instance
   */
  registerAll(bot: Bot): void {
    this.logger.log(`Registering ${this.handlers.length} handlers...`);

    this.handlers.forEach((handler) => {
      try {
        handler.register(bot);
        this.logger.debug(`Handler ${handler.constructor.name} registered`);
      } catch (error) {
        this.logger.error(
          `Error registering handler ${handler.constructor.name}: ${error.message}`,
        );
      }
    });

    this.logger.log('All handlers successfully registered');
  }

  /**
   * Get list of all registered handlers
   */
  getHandlers(): ITelegramHandler[] {
    return [...this.handlers];
  }
}

