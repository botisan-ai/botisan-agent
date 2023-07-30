import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import redisConfig from './redis.config';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [],
  exports: [],
})
export class RedisModule {}
