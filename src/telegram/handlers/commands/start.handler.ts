import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context, InlineKeyboard } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { ICommandHandler } from '../interfaces/telegram-handler.interface';
import { UsersService } from '../../../users/users.service';

/**
 * Handler for /start command
 */
@Injectable()
export class StartHandler extends BaseHandler implements ICommandHandler {
  readonly command = 'start';

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super(StartHandler.name);
  }

  register(bot: Bot): void {
    bot.command(this.command, async (ctx: Context) => {
      await this.handleWithError(ctx, async () => {
        // Создаем или обновляем пользователя
        if (ctx.from) {
          await this.usersService.createOrUpdate({
            id: ctx.from.id,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            is_bot: ctx.from.is_bot,
            language_code: ctx.from.language_code,
          });
        }

        const webAppUrl =
          this.configService.get<string>('WEB_APP_URL') || 'https://your-web-app-url.com';

        const keyboard = new InlineKeyboard()
          .webApp('📝 Запись', webAppUrl)
          .row()
          .text('ℹ️ Информация о сервисе', 'service_info');

        await ctx.reply('Привет! Я простой телеграм бот на NestJS и GrammyJS 🚀\n\nВыберите действие:', {
          reply_markup: keyboard,
        });
      });
    });
  }
}

