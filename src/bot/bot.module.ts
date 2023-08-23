import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { RedisModule } from '@src/modules/redis';
import { PrismaModule } from '@src/modules/prisma';
import { OpenAIModule } from '@src/openai';

import { botProcessors, botQueues } from './bot.queues';
import {
  AgentMessagesProcessor,
  IncomingMessagesProcessor,
} from './processors';
import { SessionService } from './session.service';
import { ConversationService } from './conversation.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    PrismaModule,
    OpenAIModule,
    BullModule.registerQueue(...botQueues),
    BullBoardModule.forFeature(
      ...botQueues.map((queue) => ({
        name: queue.name,
        adapter: BullMQAdapter,
      })),
    ),
  ],
  providers: [SessionService, ConversationService, ...botProcessors],
  exports: [AgentMessagesProcessor, IncomingMessagesProcessor],
})
export class BotModule {}
