import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';

export interface AgentJobData {
  sender: string;
  // TODO: more concrete message types
  message: {
    type: string;
    content: any;
  };
}

@Processor('agent', {
  concurrency: 1,
})
export class AgentProcessor extends WorkerHost<
  Worker<AgentJobData, void, string>
> {
  async process(job: Job<AgentJobData, void, string>) {
    console.log('AgentProcessor');
    console.log(job.data);
  }
}
