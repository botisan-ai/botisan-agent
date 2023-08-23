import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IncomingMessage } from '@src/common/interfaces';
import {
  AgentMessagesProcessor,
  IncomingMessagesProcessor,
} from '@src/bot/processors';

import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly incomingMessagesBatchDelay: number;
  private readonly returnImmediately: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly agentMessagesProcessor: AgentMessagesProcessor,
    private readonly incomingMessagesProcessor: IncomingMessagesProcessor,
  ) {
    this.incomingMessagesBatchDelay = this.configService.get(
      'queues.incomingMessagesBatchDelay',
    );
    this.returnImmediately = this.configService.get<boolean>(
      'app.returnImmediately',
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('message')
  async postMessage(@Body() message: IncomingMessage) {
    if (this.returnImmediately) {
      return this.agentMessagesProcessor.getResponses(message);
    }

    return this.incomingMessagesProcessor.addIncomingMessage(
      message,
      this.incomingMessagesBatchDelay,
    );
  }
}
