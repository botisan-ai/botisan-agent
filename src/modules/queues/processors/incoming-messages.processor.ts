import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';

export interface IncomingMessage {
  sender: string;
  // TODO: more concrete message types
  message: {
    type: string;
    content: any;
  };
}

@Processor('incoming-messages', {
  concurrency: 1,
})
export class IncomingMessagesProcessor extends WorkerHost<
  Worker<IncomingMessage[], void, string>
> {
  async process(job: Job<IncomingMessage[], void, string>): Promise<void> {
    console.log('Incoming messages');
    console.log(job.data);
  }
}
