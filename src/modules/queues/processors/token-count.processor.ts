import { Processor, WorkerHost, RegisterQueueOptions } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { RedisService } from '@src/modules/redis';

export const TOKEN_COUNT = 'token-count';

export const TOKEN_COUNT_QUEUE_OPTION: RegisterQueueOptions = {
  name: TOKEN_COUNT,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export interface TokenCountJobData {
  user: string;
  model: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

@Processor(TOKEN_COUNT, {
  concurrency: 10,
})
export class TokenCountProcessor extends WorkerHost<
  Worker<TokenCountJobData, void, string>
> {
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    super();
    this.redis = this.redisService.client;
  }

  async process(job: Job<TokenCountJobData, void, string>): Promise<void> {
    const { user, model, usage } = job.data;

    const key = `tokens:${user}`;

    // create pipeline and use hincrby to increment the values
    const pipeline = this.redis.pipeline();
    if (usage.prompt_tokens) {
      pipeline.hincrby(key, `${model}:prompt_tokens`, usage.prompt_tokens);
    }
    if (usage.completion_tokens) {
      pipeline.hincrby(
        key,
        `${model}:completion_tokens`,
        usage.completion_tokens,
      );
    }
    if (usage.total_tokens) {
      pipeline.hincrby(key, `${model}:total_tokens`, usage.total_tokens);
    }
    await pipeline.exec();
  }
}
