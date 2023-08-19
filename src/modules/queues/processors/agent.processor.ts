import {
  Processor,
  WorkerHost,
  RegisterQueueOptions,
  InjectQueue,
} from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { ChatCompletionRequestMessage } from 'openai';

import { IncomingMessage, OutgoingMessage } from '@src/common/interfaces';
import { SessionService } from '@src/bot';
import { WeatherFunction } from '@src/bot/functions';
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

@Processor(AGENT, {
  concurrency: 1,
})
export class AgentMessagesProcessor extends WorkerHost<
  Worker<IncomingMessage, OutgoingMessage[], string>
> {
  private events: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly gptRequestProcessor: GptRequestProcessor,
    @InjectQueue(AGENT)
    private readonly agentMessagesQueue: Queue<
      IncomingMessage,
      OutgoingMessage[],
      string
    >,
  ) {
    super();
    this.events = new QueueEvents(
      AGENT,
      this.configService.get('queues.bullmq'),
    );
  }

  async process(
    job: Job<IncomingMessage, OutgoingMessage[], string>,
  ): Promise<OutgoingMessage[]> {
    const { sender, message } = job.data;

    const weatherFunction = new WeatherFunction();

    const functions = {
      [weatherFunction.name()]: weatherFunction,
    };

    let session = await this.sessionService.getSession(sender);

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: `You are a friendly weather bot, while you don't know the weather on top of your head, you are provided with a function called \`get_weather\` that you can use to get the weather for a location.\n\nPlease do not call any other function than \`get_weather\`. Once the weather information is provided, you can provide an fun fact about the weather.`,
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

    let response = await this.gptRequestProcessor.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.3,
      n: 1,
      user: sender,
      // a list of functions' schema
      functions: Object.values(functions).map((fn) => fn.schema()),
      function_call: 'auto',
    });

    let hasFunctionCall = response.choices.some(
      (choice) => choice.finish_reason === 'function_call',
    );

    while (hasFunctionCall) {
      session.messagesHistory.push(
        ...response.choices.map((choice) => choice.message),
      );
      messages.push(...response.choices.map((choice) => choice.message));

      const functionCall = response.choices[0].message.function_call;
      const functionToCall = functions[functionCall.name];
      const args = functionCall.arguments
        ? JSON.parse(functionCall.arguments)
        : undefined;
      const result = await functionToCall.execute(args);

      const resultMessage: ChatCompletionRequestMessage = {
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(result),
      };

      session.messagesHistory.push(resultMessage);
      messages.push(resultMessage);

      response = await this.gptRequestProcessor.createChatCompletion({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        user: sender,
        // a list of functions' schema
        functions: Object.values(functions).map((fn) => fn.schema()),
        function_call: 'auto',
      });

      hasFunctionCall = response.choices.some(
        (choice) => choice.finish_reason === 'function_call',
      );
    }

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

  async getResponses(message: IncomingMessage): Promise<OutgoingMessage[]> {
    const job = await this.agentMessagesQueue.add(message.sender, message);

    return job.waitUntilFinished(this.events);
  }
}
