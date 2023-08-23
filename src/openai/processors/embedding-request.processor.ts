import {
  InjectQueue,
  Processor,
  WorkerHost,
  RegisterQueueOptions,
} from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import {
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
  OpenAIApi,
} from 'openai';

import { OpenAIService } from '../openai.service';
import { TokenCountJobData } from '../token-count.service';
import { TOKEN_COUNT } from './token-count.processor';

export const EMBEDDING_REQUEST = 'embedding-request';

export const EMBEDDING_REQUEST_QUEUE_OPTION: RegisterQueueOptions = {
  name: EMBEDDING_REQUEST,
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

@Processor(EMBEDDING_REQUEST, {
  concurrency: 10,
  // embedding rate limit
  limiter: {
    max: 3000,
    duration: 60000,
  },
})
export class EmbeddingRequestProcessor extends WorkerHost<
  Worker<CreateEmbeddingRequest, CreateEmbeddingResponse, string>
> {
  private readonly openai: OpenAIApi;
  private readonly events: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
    @InjectQueue(EMBEDDING_REQUEST)
    private readonly embeddingRequestQueue: Queue<
      CreateEmbeddingRequest,
      CreateEmbeddingResponse,
      string
    >,
    @InjectQueue(TOKEN_COUNT)
    private readonly tokenCountQueue: Queue<TokenCountJobData, void, string>,
  ) {
    super();
    this.openai = this.openAIService.openai;
    this.events = new QueueEvents(
      EMBEDDING_REQUEST,
      this.configService.get('queues.bullmq'),
    );
  }

  async process(
    job: Job<CreateEmbeddingRequest, CreateEmbeddingResponse, string>,
  ): Promise<CreateEmbeddingResponse> {
    const response = await this.openai.createEmbedding(job.data);

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

  async createEmbedding(
    request: CreateEmbeddingRequest,
  ): Promise<CreateEmbeddingResponse> {
    const job = await this.embeddingRequestQueue.add(request.user, request);

    return job.waitUntilFinished(this.events);
  }
}
