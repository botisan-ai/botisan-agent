import { RegisterQueueOptions } from '@nestjs/bullmq';

import {
  AGENT_QUEUE_OPTION,
  AgentMessagesProcessor,
  INCOMING_MESSAGES_QUEUE_OPTION,
  IncomingMessagesProcessor,
  SAVE_HISTORY_QUEUE_OPTION,
  SaveHistoryProcessor,
} from './processors';

export const botQueues: RegisterQueueOptions[] = [
  AGENT_QUEUE_OPTION,
  INCOMING_MESSAGES_QUEUE_OPTION,
  SAVE_HISTORY_QUEUE_OPTION,
];

export const botProcessors = [
  AgentMessagesProcessor,
  IncomingMessagesProcessor,
  SaveHistoryProcessor,
];
