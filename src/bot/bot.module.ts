import { Module } from '@nestjs/common';

import { RedisModule } from '@src/modules/redis';

import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  imports: [RedisModule],
  providers: [SessionService, TokenService],
  exports: [SessionService, TokenService],
})
export class BotModule {}
