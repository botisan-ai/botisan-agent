import { Processor, WorkerHost, RegisterQueueOptions } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';

export const SAVE_HISTORY = 'save-history';

export const SAVE_HISTORY_QUEUE_OPTION: RegisterQueueOptions = {
  name: SAVE_HISTORY,
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

@Processor(SAVE_HISTORY, {
  concurrency: 1,
})
export class SaveHistoryProcessor extends WorkerHost<
  Worker<any, void, string>
> {
  constructor() {
    super();
  }

  async process(job: Job<any, void, string>): Promise<void> {
    console.log(job.data);
  }
}
