import { RegisterQueueOptions } from '@nestjs/bullmq';

import {
  EMBEDDING_REQUEST_QUEUE_OPTION,
  EmbeddingRequestProcessor,
  GPT_REQUEST_QUEUE_OPTION,
  GptRequestProcessor,
  TOKEN_COUNT_QUEUE_OPTION,
  TokenCountProcessor,
} from './processors';

export const openAIQueues: RegisterQueueOptions[] = [
  EMBEDDING_REQUEST_QUEUE_OPTION,
  GPT_REQUEST_QUEUE_OPTION,
  TOKEN_COUNT_QUEUE_OPTION,
];

export const openAIProcessors = [
  EmbeddingRequestProcessor,
  GptRequestProcessor,
  TokenCountProcessor,
];
