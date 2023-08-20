import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ChatCompletionRequestMessage } from 'openai';

import { RedisService } from '@src/modules/redis';

export interface Session {
  messagesHistory: ChatCompletionRequestMessage[];
  slots?: Record<string, any>;
}

// session expires in 2 days
const SESSION_EXPIRE = 60 * 60 * 24 * 2;

const SESSION_PREFIX = 'session';

@Injectable()
export class SessionService {
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.client;
  }

  async getSession(sender: string): Promise<Session | null> {
    const key = `${SESSION_PREFIX}:${sender}`;

    const exists = await this.redis.exists(key);
    if (exists === 0) {
      return null;
    }

    return JSON.parse(await this.redis.get(key));
  }

  async setSession(sender: string, data: Session): Promise<void> {
    const key = `${SESSION_PREFIX}:${sender}`;

    // create pipeline and set value and expires
    const pipeline = this.redis.pipeline();
    pipeline.set(key, JSON.stringify(data));
    pipeline.expire(key, SESSION_EXPIRE);
    await pipeline.exec();
  }
}
