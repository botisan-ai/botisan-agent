import { RegisterQueueOptions } from '@nestjs/bullmq';

import {
  AGENT_QUEUE_OPTION,
  AgentMessagesProcessor,
  EMBEDDING_REQUEST_QUEUE_OPTION,
  EmbeddingRequestProcessor,
  GPT_REQUEST_QUEUE_OPTION,
  GptRequestProcessor,
  INCOMING_MESSAGES_QUEUE_OPTION,
  IncomingMessagesProcessor,
  SAVE_HISTORY_QUEUE_OPTION,
  SaveHistoryProcessor,
  TOKEN_COUNT_QUEUE_OPTION,
  TokenCountProcessor,
} from './processors';

export const queues: RegisterQueueOptions[] = [
  AGENT_QUEUE_OPTION,
  EMBEDDING_REQUEST_QUEUE_OPTION,
  GPT_REQUEST_QUEUE_OPTION,
  INCOMING_MESSAGES_QUEUE_OPTION,
  SAVE_HISTORY_QUEUE_OPTION,
  TOKEN_COUNT_QUEUE_OPTION,
];

export const processors = [
  AgentMessagesProcessor,
  EmbeddingRequestProcessor,
  GptRequestProcessor,
  IncomingMessagesProcessor,
  SaveHistoryProcessor,
  TokenCountProcessor,
];
