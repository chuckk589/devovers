import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { ICommandHandler } from '../interfaces/telegram-handler.interface';

/**
 * Handler for /help command
 */
@Injectable()
export class HelpHandler extends BaseHandler implements ICommandHandler {
  readonly command = 'help';

  constructor() {
    super(HelpHandler.name);
  }

  register(bot: Bot): void {
    bot.command(this.command, async (ctx: Context) => {
      await this.handleWithError(ctx, async () => {
        const helpText =
          'Доступные команды:\n' +
          '/start - Начать работу с ботом\n' +
          '/help - Показать эту справку\n' +
          '/echo <текст> - Повторить ваш текст';
        await ctx.reply(helpText);
      });
    });
  }
}

