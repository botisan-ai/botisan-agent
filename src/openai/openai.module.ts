import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { RedisModule } from '@src/modules/redis';

import openaiConfig from './openai.config';
import { OpenAIService } from './openai.service';
import { processors, queues } from './queues';
import { EmbeddingRequestProcessor, GptRequestProcessor } from './processors';
import { TokenCountService } from './token-count.service';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forFeature(openaiConfig),
    BullModule.registerQueue(...queues),
    BullBoardModule.forFeature(
      ...queues.map((queue) => ({
        name: queue.name,
        adapter: BullMQAdapter,
      })),
    ),
  ],
  providers: [OpenAIService, TokenCountService, ...processors],
  exports: [EmbeddingRequestProcessor, GptRequestProcessor],
})
export class OpenAIModule {}
