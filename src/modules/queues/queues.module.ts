import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import queuesConfig from './queues.config';
import { queues } from './queues';
import { AgentProcessor } from './processors';

@Module({
  imports: [
    ConfigModule.forFeature(queuesConfig),
    BullBoardModule.forRoot({
      route: '/bullmq',
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
  ],
  providers: [AgentProcessor],
  exports: [],
})
export class QueuesModule {}
