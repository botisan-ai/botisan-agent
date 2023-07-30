import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  public readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.get('redis.config'));
  }
}
