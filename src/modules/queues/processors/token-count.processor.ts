import { Processor, WorkerHost, RegisterQueueOptions } from '@nestjs/bullmq';
import { TokenCountJobData, TokenService } from '@src/bot';
import { Job, Worker } from 'bullmq';

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
  constructor(private readonly tokenService: TokenService) {
    super();
  }

  async process(job: Job<TokenCountJobData, void, string>): Promise<void> {
    await this.tokenService.recordTokenUsage(job.data);
  }
}
