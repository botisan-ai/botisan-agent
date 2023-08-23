import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { QueuesModule } from '@src/modules/queues';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './app.config';
import { BotModule } from './bot';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      // mimic behaviors from nextjs
      envFilePath: ['.env', `.env.${ENV}`, `.env.${ENV}.local`, '.env.local'],
      load: [appConfig],
    }),
    QueuesModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
