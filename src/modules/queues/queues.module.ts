import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

import { BotModule } from '@src/bot';

import queuesConfig from './queues.config';

@Module({
  imports: [
    ConfigModule.forFeature(queuesConfig),
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
  ],
  exports: [BullModule],
})
export class QueuesModule {}
