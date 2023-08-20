import {
  InjectQueue,
  Processor,
  RegisterQueueOptions,
  WorkerHost,
} from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  OpenAIApi,
} from 'openai';

import { OpenAIService } from '@src/modules/openai';
import { TokenCountJobData } from '@src/bot';

import { TOKEN_COUNT } from './token-count.processor';

export const GPT_REQUEST = 'gpt-request';

export const GPT_REQUEST_QUEUE_OPTION: RegisterQueueOptions = {
  name: GPT_REQUEST,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    // removeOnComplete: true,
    // removeOnFail: true,
  },
};

@Processor(GPT_REQUEST, {
  concurrency: 10,
  // GPT-4 rate limit
  limiter: {
    max: 200,
    duration: 60000,
  },
})
export class GptRequestProcessor extends WorkerHost<
  Worker<CreateChatCompletionRequest, CreateChatCompletionResponse, string>
> {
  private readonly openai: OpenAIApi;
  private readonly events: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
    @InjectQueue(GPT_REQUEST)
    private readonly gptRequestQueue: Queue<
      CreateChatCompletionRequest,
      CreateChatCompletionResponse,
      string
    >,
    @InjectQueue(TOKEN_COUNT)
    private readonly tokenCountQueue: Queue<TokenCountJobData, void, string>,
  ) {
    super();
    this.openai = this.openAIService.openai;
    this.events = new QueueEvents(
      GPT_REQUEST,
      this.configService.get('queues.bullmq'),
    );
  }

  async process(
    job: Job<CreateChatCompletionRequest, CreateChatCompletionResponse, string>,
  ): Promise<CreateChatCompletionResponse> {
    const response = await this.openai.createChatCompletion(job.data);

    job.log(JSON.stringify(response.data));

    if (response.status !== 200) {
      throw new Error(JSON.stringify(response.data));
    }

    await this.tokenCountQueue.add(job.data.user, {
      model: job.data.model,
      user: job.data.user,
      usage: response.data.usage,
    });

    return response.data;
  }

  async createChatCompletion(
    request: CreateChatCompletionRequest,
  ): Promise<CreateChatCompletionResponse> {
    const job = await this.gptRequestQueue.add(request.user, request);

    return job.waitUntilFinished(this.events);
  }
}
