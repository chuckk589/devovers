import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

/**
 * Service for sending messages via Telegram Bot API
 */
@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private bot: Bot | null = null;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token) {
      this.bot = new Bot(token);
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set. Telegram messages will not be sent.');
    }
  }

  /**
   * Send a message to a user by their Telegram ID
   * @param telegramId - Telegram user ID
   * @param message - Message text to send
   * @returns Promise<boolean> - true if message was sent successfully
   */
  async sendMessage(telegramId: number, message: string): Promise<boolean> {
    if (!this.bot) {
      this.logger.warn('Bot is not initialized. Message not sent.');
      return false;
    }

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
      this.logger.log(`Message sent successfully to user ${telegramId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to user ${telegramId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a formatted answer notification to a user
   * @param telegramId - Telegram user ID
   * @param questionMessage - Original question message
   * @param answerMessage - Answer message from admin
   * @returns Promise<boolean> - true if message was sent successfully
   */
  async sendAnswerNotification(
    telegramId: number,
    questionMessage: string,
    answerMessage: string,
  ): Promise<boolean> {
    const formattedMessage = `
<b>📩 Ответ на ваш вопрос</b>

<b>Ваш вопрос:</b>
${this.escapeHtml(questionMessage)}

<b>Ответ:</b>
${this.escapeHtml(answerMessage)}
    `.trim();

    return this.sendMessage(telegramId, formattedMessage);
  }

  /**
   * Send a notification about a new question to admins
   * @param telegramIds - Array of Telegram user IDs (admins)
   * @param userName - Name of the user who asked the question
   * @param questionMessage - Question message text
   * @returns Promise<number> - Number of successfully sent messages
   */
  async sendNewQuestionNotification(
    telegramIds: number[],
    userName: string,
    questionMessage: string,
  ): Promise<number> {
    if (!this.bot) {
      this.logger.warn('Bot is not initialized. Messages not sent.');
      return 0;
    }

    const formattedMessage = `
<b>❓ Новый вопрос от пользователя</b>

<b>Пользователь:</b> ${this.escapeHtml(userName)}

<b>Вопрос:</b>
${this.escapeHtml(questionMessage)}
    `.trim();

    let successCount = 0;
    for (const telegramId of telegramIds) {
      try {
        await this.bot.api.sendMessage(telegramId, formattedMessage, {
          parse_mode: 'HTML',
        });
        this.logger.log(`New question notification sent successfully to admin ${telegramId}`);
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to send new question notification to admin ${telegramId}: ${error.message}`);
      }
    }

    return successCount;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

