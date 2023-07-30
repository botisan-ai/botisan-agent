import { RegisterQueueOptions } from '@nestjs/bullmq';

export const queues: RegisterQueueOptions[] = [
  {
    name: 'agent',
    streams: {
      events: {
        maxLen: 100,
      },
    },
    defaultJobOptions: {
      removeOnComplete: false,
      removeOnFail: false,
      // attempts: 10,
      // backoff: {
      //   type: 'exponential',
      //   delay: 1000,
      // },
    },
  },
];
