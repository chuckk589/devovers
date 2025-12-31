import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { BaseHandler } from '../base/base-handler';
import { IMessageHandler } from '../interfaces/telegram-handler.interface';

/**
 * Handler for text messages
 */
@Injectable()
export class TextMessageHandler extends BaseHandler implements IMessageHandler {
  readonly messageType = 'message:text';

  constructor() {
    super(TextMessageHandler.name);
  }

  register(bot: Bot): void {
    // bot.on(this.messageType, async (ctx: Context) => {
    //   await this.handleWithError(ctx, async () => {
    //     if (ctx.message?.text) {
    //       await ctx.reply(`Вы написали: ${ctx.message.text}`);
    //     }
    //   });
    // });
  }
}

