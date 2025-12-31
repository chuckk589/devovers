import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { ITelegramHandler } from '../interfaces/telegram-handler.interface';

/**
 * Handler for service info callback button
 */
@Injectable()
export class ServiceInfoCallbackHandler extends BaseHandler implements ITelegramHandler {
  constructor() {
    super(ServiceInfoCallbackHandler.name);
  }

  register(bot: Bot): void {
    bot.callbackQuery('service_info', async (ctx: Context) => {
      await this.handleWithError(ctx, async () => {
        await ctx.answerCallbackQuery();
        const serviceInfo =
          'ℹ️ Информация о сервисе\n\n';
        await ctx.reply(serviceInfo);
      });
    });
  }
}

