import { Processor, WorkerHost, RegisterQueueOptions } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';
import { ChatCompletionRequestMessage } from 'openai';

import { SessionService } from '@src/bot';
import { GptRequestProcessor } from './gpt-request.processor';

export const AGENT = 'agent';

export const AGENT_QUEUE_OPTION: RegisterQueueOptions = {
  name: AGENT,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    // removeOnComplete: true,
    // removeOnFail: true,
    // attempts: 10,
    // backoff: {
    //   type: 'exponential',
    //   delay: 1000,
    // },
  },
};

export interface IncomingMessage {
  sender: string;
  // TODO: more concrete message types
  message: {
    type: string;
    content: any;
  };
}

export interface OutgoingMessage {
  recipient: string;
  type: string;
  content: any;
}

@Processor(AGENT, {
  concurrency: 1,
})
export class AgentMessagesProcessor extends WorkerHost<
  Worker<IncomingMessage, OutgoingMessage[], string>
> {
  constructor(
    private readonly sessionService: SessionService,
    private readonly gptRequestProcessor: GptRequestProcessor,
  ) {
    super();
  }

  async process(
    job: Job<IncomingMessage, OutgoingMessage[], string>,
  ): Promise<OutgoingMessage[]> {
    const { sender, message } = job.data;

    let session = await this.sessionService.getSession(sender);

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content:
          'You are a friendly chatbot, the person you talk to knows you are an AI language model, so no need to reiterate in every message, and try to carry on the conversation as a normal human would. Try to have feelings and opinions, and express them in your own words.',
      },
    ];

    if (!session) {
      session = {
        messagesHistory: [
          {
            role: 'user',
            content: message.content,
          },
        ],
      };
    } else {
      session.messagesHistory.push({
        role: 'user',
        content: message.content,
      });
    }

    messages.push(...session.messagesHistory);

    const response = await this.gptRequestProcessor.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.3,
      user: sender,
    });

    session.messagesHistory.push(
      ...response.choices.map((choice) => choice.message),
    );

    await this.sessionService.setSession(sender, session);

    return response.choices.map((choice) => ({
      recipient: sender,
      type: 'text',
      content: choice.message.content,
    }));
  }
}
