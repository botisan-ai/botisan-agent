import {
  InjectQueue,
  Processor,
  WorkerHost,
  RegisterQueueOptions,
} from '@nestjs/bullmq';
import { Job, Queue, Worker } from 'bullmq';

import { IncomingMessage } from '@src/common/interfaces';
import { AGENT } from './agent.processor';

export const INCOMING_MESSAGES = 'incoming-messages';

export const INCOMING_MESSAGES_QUEUE_OPTION: RegisterQueueOptions = {
  name: INCOMING_MESSAGES,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
};

@Processor(INCOMING_MESSAGES, {
  concurrency: 1,
})
export class IncomingMessagesProcessor extends WorkerHost<
  Worker<IncomingMessage[], void, string>
> {
  constructor(
    @InjectQueue(AGENT) private readonly agentQueue: Queue,
    @InjectQueue(INCOMING_MESSAGES)
    private readonly incomingMessagesQueue: Queue<
      IncomingMessage[],
      void,
      string
    >,
  ) {
    super();
  }

  async process(job: Job<IncomingMessage[], void, string>): Promise<void> {
    const sender = job.data[0].sender;

    // if not all of the messages are from the same sender, we should error
    const sameSender = job.data.every((message) => message.sender === sender);

    if (!sameSender) {
      throw new Error('All messages must be from the same sender');
    }

    // concatentate all of the text messages into one message
    const textMessages = job.data
      .filter((message) => message.message.type === 'text')
      .map((message) => message.message.content)
      .join('\n\n');

    // TODO: process other message types
    const message = {
      sender,
      message: {
        type: 'text',
        content: textMessages,
      },
    };

    job.log(JSON.stringify(message));

    await this.agentQueue.add(sender, message);
  }

  async addIncomingMessage(
    message: IncomingMessage,
    delay: number,
  ): Promise<Job<IncomingMessage[], void, string>> {
    const { sender } = message;

    const jobState = await this.incomingMessagesQueue.getJobState(sender);

    if (jobState === 'delayed') {
      const job = await this.incomingMessagesQueue.getJob(sender);
      const removed = await this.incomingMessagesQueue.remove(sender);
      if (removed <= 0) {
        throw new Error('Failed to remove job');
      }

      return this.incomingMessagesQueue.add(sender, [...job.data, message], {
        jobId: sender,
        delay,
      });
    }

    return this.incomingMessagesQueue.add(sender, [message], {
      jobId: sender,
      delay,
    });
  }
}
