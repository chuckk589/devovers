import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { ITelegramHandler } from '../interfaces/telegram-handler.interface';

/**
 * Handler for appointment callback button
 */
@Injectable()
export class AppointmentCallbackHandler extends BaseHandler implements ITelegramHandler {
  constructor() {
    super(AppointmentCallbackHandler.name);
  }

  register(bot: Bot): void {
    bot.callbackQuery('appointment', async (ctx: Context) => {
      await this.handleWithError(ctx, async () => {
        await ctx.answerCallbackQuery();
        await ctx.reply('📝 Функция записи пока находится в разработке.');
      });
    });
  }
}

