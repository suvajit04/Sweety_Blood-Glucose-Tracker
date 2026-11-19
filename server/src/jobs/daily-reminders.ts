import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { parseDateOnly, todayInAppTimeZone } from '../utils/date.js';

const QUEUE_NAME = 'daily-glucose-reminders';

export async function startDailyReminderWorker(): Promise<() => Promise<void>> {
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  const queue = new Queue(QUEUE_NAME, { connection });

  try {
    await queue.upsertJobScheduler(
      'daily-glucose-reminder-scan',
      { pattern: '0 0 19 * * *', tz: env.APP_TIME_ZONE },
      {
        name: 'daily-reminder-scan',
        data: {},
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      },
    );
  } catch (error) {
    await queue.close().catch(() => undefined);
    connection.disconnect();
    throw error;
  }

  const worker = new Worker(QUEUE_NAME, async () => {
    const date = parseDateOnly(todayInAppTimeZone());
    const [patients, counts] = await Promise.all([
      prisma.user.findMany({ where: { role: 'PATIENT' }, select: { id: true, name: true, email: true } }),
      prisma.reading.groupBy({
        by: ['userId'],
        where: { date },
        _count: { _all: true },
      }),
    ]);
    const countByUser = new Map(counts.map((item) => [item.userId, item._count._all]));
    const due = patients.filter((patient) => (countByUser.get(patient.id) ?? 0) < 4);

    // Assignment requirement: record/log a daily reminder candidate. This job does not
    // send medical advice or contact patients; a delivery channel can be added later.
    for (const patient of due) {
      console.info(`[daily-reminder] ${date.toISOString().slice(0, 10)} | ${patient.email} | ${countByUser.get(patient.id) ?? 0}/4 readings`);
    }
    return { date: date.toISOString().slice(0, 10), reminderCandidates: due.length };
  }, { connection, concurrency: 1 });

  worker.on('failed', (job, error) => {
    console.error(`[daily-reminder] Job ${job?.id ?? 'unknown'} failed:`, error);
  });
  worker.on('error', (error) => console.error('[daily-reminder] Worker error:', error));

  console.info('[daily-reminder] BullMQ worker started; daily scan scheduled for 19:00', env.APP_TIME_ZONE);
  return async () => {
    await worker.close();
    await queue.close();
    await connection.quit();
  };
}
