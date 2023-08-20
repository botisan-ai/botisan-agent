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
import { SessionService, VectorService } from '@src/bot';
import { WeatherFunction } from '@src/bot/functions';

import { GptRequestProcessor } from './gpt-request.processor';
import { EmbeddingRequestProcessor } from './embedding-request.processor';

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

const model = 'gpt-3.5-turbo';

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
    private readonly vectorService: VectorService,
    private readonly gptRequestProcessor: GptRequestProcessor,
    private readonly embeddingRequestProcessor: EmbeddingRequestProcessor,
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

    let session = await this.sessionService.getSession(sender);

    if (!session) {
      session = {
        messagesHistory: [
          {
            role: 'assistant',
            content: `Looks like I couldn't reach you today about the form you filled out. Lets chat about your injury consultation. What time is good for you?

            txt opt out to stop`,
          },
          {
            role: 'user',
            content: message.content,
          },
        ],
        slots: {},
      };
    } else {
      session.messagesHistory.push({
        role: 'user',
        content: message.content,
      });
    }

    const weatherFunction = new WeatherFunction();

    const functions = {
      [weatherFunction.name()]: weatherFunction,
    };

    const embeddingResponse =
      await this.embeddingRequestProcessor.createEmbedding({
        model: 'text-embedding-ada-002',
        input: message.content,
        user: sender,
      });

    const embedding = embeddingResponse.data[0].embedding;

    const conversations = await this.vectorService.searchSimilarConversations(
      embedding,
    );

    job.log(`${JSON.stringify(conversations, null, 2)}`);

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: `You are a friendly weather bot, while you don't know the weather on top of your head, you are provided with a function called \`get_weather\` that you can use to get the weather for a location.\n\nPlease do not call any other function than \`get_weather\`. Once the weather information is provided, you can provide an fun fact about the weather.`,
      },
    ];

    for (const conversation of conversations) {
      messages.push({
        role: 'system',
        content: `# Example Conversation`,
      });

      for (const item of conversation.items) {
        const msg = {
          role: item.role,
          content: item.content,
        };

        if (item.function_call) {
          msg['function_call'] = JSON.parse(item.function_call);
        }

        if (item.role === 'function') {
          msg['name'] = item.name;
        }

        messages.push(msg);
      }
    }

    messages.push({
      role: 'system',
      content: `# Actual Conversation`,
    });
    messages.push(...session.messagesHistory);

    let response = await this.gptRequestProcessor.createChatCompletion({
      model,
      messages,
      temperature: 0.3,
      n: 1,
      user: sender,
      // a list of functions' schema
      functions: Object.values(functions).map((fn) => fn.schema()),
      function_call: 'auto',
    });

    let choice = response.choices[0];

    while (choice.finish_reason === 'function_call') {
      session.messagesHistory.push(choice.message);
      messages.push(choice.message);

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
        model,
        messages,
        temperature: 0.3,
        n: 1,
        user: sender,
        // a list of functions' schema
        functions: Object.values(functions).map((fn) => fn.schema()),
        function_call: 'auto',
      });

      choice = response.choices[0];
    }

    session.messagesHistory.push(choice.message);
    await this.sessionService.setSession(sender, session);

    return [
      {
        recipient: sender,
        type: 'text',
        content: choice.message.content,
      },
    ];
  }

  async getResponses(message: IncomingMessage): Promise<OutgoingMessage[]> {
    const job = await this.agentMessagesQueue.add(message.sender, message);

    return job.waitUntilFinished(this.events);
  }
}
