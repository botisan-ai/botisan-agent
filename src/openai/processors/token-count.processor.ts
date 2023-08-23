import { Processor, WorkerHost, RegisterQueueOptions } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';

import { TokenCountJobData, TokenCountService } from '../token-count.service';

export const TOKEN_COUNT = 'token-count';

export const TOKEN_COUNT_QUEUE_OPTION: RegisterQueueOptions = {
  name: TOKEN_COUNT,
  streams: {
    events: {
      maxLen: 100,
    },
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
};

@Processor(TOKEN_COUNT, {
  concurrency: 10,
})
export class TokenCountProcessor extends WorkerHost<
  Worker<TokenCountJobData, void, string>
> {
  constructor(private readonly tokenCountService: TokenCountService) {
    super();
  }

  async process(job: Job<TokenCountJobData, void, string>): Promise<void> {
    await this.tokenCountService.recordTokenUsage(job.data);
  }
}
