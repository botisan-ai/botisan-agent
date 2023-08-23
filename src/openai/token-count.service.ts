import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { RedisService } from '@src/modules/redis';

export interface TokenCountJobData {
  user: string;
  model: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

@Injectable()
export class TokenCountService {
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.client;
  }

  async recordTokenUsage(input: TokenCountJobData): Promise<void> {
    const { user, model, usage } = input;

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
