import { registerAs } from '@nestjs/config';

export default registerAs('queues', () => ({
  incomingMessagesBatchDelay: 3000,
  bullmq: {
    prefix: process.env.MQ_PREFIX || 'botmq',
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      db: Number(process.env.REDIS_DB) || 0,
    },
  },
}));
