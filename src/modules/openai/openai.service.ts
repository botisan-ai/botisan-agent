import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenAIService {
  public readonly openai: OpenAIApi;
  constructor(private readonly configService: ConfigService) {
    const config = new Configuration(this.configService.get('openai'));
    this.openai = new OpenAIApi(config);
  }
}
