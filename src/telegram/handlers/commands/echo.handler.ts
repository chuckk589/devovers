import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { ICommandHandler } from '../interfaces/telegram-handler.interface';

/**
 * Handler for /echo command
 */
@Injectable()
export class EchoHandler extends BaseHandler implements ICommandHandler {
  readonly command = 'echo';

  constructor() {
    super(EchoHandler.name);
  }

  register(bot: Bot): void {
    bot.command(this.command, async (ctx: Context) => {
      await this.handleWithError(ctx, async () => {
        const text = ctx.message?.text?.replace(`/${this.command}`, '').trim();
        if (text) {
          await ctx.reply(`Вы сказали: ${text}`);
        } else {
          await ctx.reply('Пожалуйста, укажите текст после команды /echo');
        }
      });
    });
  }
}

