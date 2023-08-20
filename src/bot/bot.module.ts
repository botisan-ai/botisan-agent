import { Module } from '@nestjs/common';

import { RedisModule } from '@src/modules/redis';
import { PrismaModule } from '@src/modules/prisma';

import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { VectorService } from './vector.service';

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [SessionService, TokenService, VectorService],
  exports: [SessionService, TokenService, VectorService],
})
export class BotModule {}
