import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { startDailyReminderWorker } from './jobs/daily-reminders.js';

let closeReminderWorker: (() => Promise<void>) | undefined;

const server = app.listen(env.PORT, () => {
  console.log(`Sweety API is running at http://localhost:${env.PORT}`);
  if (env.NODE_ENV !== 'test') {
    void startDailyReminderWorker()
      .then((close) => { closeReminderWorker = close; })
      .catch((error) => console.error('[daily-reminder] Redis is unavailable; API will continue without the reminder worker.', error));
  }
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down Sweety API...`);
  server.close(async () => {
    await closeReminderWorker?.();
    redis.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
