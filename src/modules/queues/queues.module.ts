import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { BotModule } from '@src/bot';

import { RedisModule } from '../redis';
import { OpenAIModule } from '../openai';
import queuesConfig from './queues.config';
import { processors, queues } from './queues';
import { AgentMessagesProcessor } from './processors';

@Module({
  imports: [
    ConfigModule.forFeature(queuesConfig),
    RedisModule,
    BotModule,
    BullBoardModule.forRoot({
      route: '/ctrls',
      adapter: ExpressAdapter,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('queues.bullmq'),
    }),
    BullModule.registerQueue(...queues),
    BullBoardModule.forFeature(
      ...queues.map((queue) => ({
        name: queue.name,
        adapter: BullMQAdapter,
      })),
    ),
    OpenAIModule,
  ],
  providers: [...processors],
  exports: [BullModule, AgentMessagesProcessor],
})
export class QueuesModule {}
