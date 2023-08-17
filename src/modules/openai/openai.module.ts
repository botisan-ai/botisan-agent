import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import openaiConfig from './openai.config';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule.forFeature(openaiConfig)],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
