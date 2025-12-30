import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { HandlersRegistryService } from './handlers/handlers-registry.service';
import { StartHandler } from './handlers/commands/start.handler';
import { HelpHandler } from './handlers/commands/help.handler';
import { EchoHandler } from './handlers/commands/echo.handler';
import { TextMessageHandler } from './handlers/messages/text-message.handler';
import { ErrorHandler } from './handlers/error/error.handler';
import { ServiceInfoCallbackHandler } from './handlers/callbacks/service-info.callback';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    TelegramService,
    HandlersRegistryService,
    // Command handlers
    StartHandler,
    HelpHandler,
    EchoHandler,
    // Message handlers
    TextMessageHandler,
    // Callback handlers
    ServiceInfoCallbackHandler,
    // Error handler
    ErrorHandler,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

