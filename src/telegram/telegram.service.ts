import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { HandlersRegistryService } from './handlers/handlers-registry.service';

/**
 * Service for managing Telegram bot
 */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot;

  constructor(
    private readonly configService: ConfigService,
    private readonly handlersRegistry: HandlersRegistryService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    }
    this.bot = new Bot(token);
    this.handlersRegistry.registerAll(this.bot);
  }

  async onModuleInit() {
    try {
      await this.bot.start();
      this.logger.log('Telegram бот успешно запущен');
    } catch (error) {
      this.logger.error(`Ошибка при запуске бота: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.bot.stop();
      this.logger.log('Telegram бот остановлен');
    } catch (error) {
      this.logger.error(`Ошибка при остановке бота: ${error.message}`);
    }
  }

  getBot(): Bot {
    return this.bot;
  }
}

