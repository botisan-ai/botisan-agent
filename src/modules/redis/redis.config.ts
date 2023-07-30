import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  config: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    db: Number(process.env.REDIS_DB) || 0,
  },
}));
