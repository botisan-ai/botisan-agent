import { registerAs } from '@nestjs/config';

export default registerAs('prisma', () => ({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://botisan:agent@localhost:5432/botisan-agent',
    },
  },
}));
