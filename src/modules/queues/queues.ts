import { RegisterQueueOptions } from '@nestjs/bullmq';

export const queues: RegisterQueueOptions[] = [
  {
    name: 'incoming-messages',
    streams: {
      events: {
        maxLen: 100,
      },
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
      // attempts: 10,
      // backoff: {
      //   type: 'exponential',
      //   delay: 1000,
      // },
    },
  },
];
