import { Module, forwardRef } from '@nestjs/common';

import { RedisModule } from '@src/modules';
import { SessionService } from './session.service';

@Module({
  imports: [forwardRef(() => RedisModule)],
  providers: [SessionService],
  exports: [SessionService],
})
export class BotModule {}
