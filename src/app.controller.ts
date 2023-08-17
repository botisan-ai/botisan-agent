import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

import {
  INCOMING_MESSAGES,
  IncomingMessage,
  AgentMessagesProcessor,
} from '@src/modules/queues';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly incomingMessagesBatchDelay: number;
  private readonly returnImmediately: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly agentMessagesProcessor: AgentMessagesProcessor,
    @InjectQueue(INCOMING_MESSAGES)
    private readonly incomingMessagesQueue: Queue<
      IncomingMessage[],
      void,
      string
    >,
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

    return this.processMessageAsync(message);
  }

  private async processMessageAsync(
    message: IncomingMessage,
  ): Promise<Job<IncomingMessage[], void, string>> {
    const jobState = await this.incomingMessagesQueue.getJobState(
      message.sender,
    );

    if (jobState === 'delayed') {
      const job = await this.incomingMessagesQueue.getJob(message.sender);
      const removed = await this.incomingMessagesQueue.remove(message.sender);
      if (removed <= 0) {
        throw new Error('Failed to remove job');
      }

      return this.incomingMessagesQueue.add(
        message.sender,
        [...job.data, message],
        {
          jobId: message.sender,
          delay: this.incomingMessagesBatchDelay,
        },
      );
    }

    return this.incomingMessagesQueue.add(message.sender, [message], {
      jobId: message.sender,
      delay: this.incomingMessagesBatchDelay,
    });
  }
}
