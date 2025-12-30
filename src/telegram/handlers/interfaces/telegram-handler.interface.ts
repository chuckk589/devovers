import { Bot, Context } from 'grammy';

/**
 * Interface for Telegram command and message handlers
 */
export interface ITelegramHandler {
  /**
   * Registers the handler in the bot
   * @param bot - Grammy bot instance
   */
  register(bot: Bot): void;
}

/**
 * Base interface for command handlers
 */
export interface ICommandHandler extends ITelegramHandler {
  /**
   * Command name (without slash)
   */
  readonly command: string;
}

/**
 * Base interface for message handlers
 */
export interface IMessageHandler extends ITelegramHandler {
  /**
   * Message type to handle
   */
  readonly messageType: string;
}

