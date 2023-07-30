import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule, QueuesModule } from './modules';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './app.config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      // mimic behaviors from nextjs
      envFilePath: [`.env.${ENV}.local`, `.env.${ENV}`, `.env.local`, '.env'],
      load: [appConfig],
    }),
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
