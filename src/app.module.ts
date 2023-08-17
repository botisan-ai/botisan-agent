import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { QueuesModule } from './modules';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './app.config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      // mimic behaviors from nextjs
      envFilePath: ['.env', `.env.${ENV}`, `.env.${ENV}.local`, '.env.local'],
      load: [appConfig],
    }),
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
