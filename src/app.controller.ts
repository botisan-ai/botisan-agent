import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AppService } from './app.service';
import { IncomingMessage } from './modules/queues';

@Controller()
export class AppController {
  private readonly incomingMessagesBatchDelay: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    @InjectQueue('incoming-messages')
    private readonly incomingMessagesQueue: Queue<
      IncomingMessage[],
      void,
      string
    >,
  ) {
    this.incomingMessagesBatchDelay = this.configService.get(
      'queues.incomingMessagesBatchDelay',
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('message')
  async postMessage(@Body() message: IncomingMessage) {
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
