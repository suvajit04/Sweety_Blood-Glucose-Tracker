import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 1500,
});

redis.on('error', (error) => {
  // Redis is an optimization for reports; a Redis outage must not take down the API.
  console.warn(`[redis] ${error.message}`);
});

async function ensureConnected(): Promise<void> {
  if (redis.status === 'wait') await redis.connect();
}

export async function getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  try {
    await ensureConnected();
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;
  } catch (error) {
    console.warn('[redis] Cache read skipped:', error instanceof Error ? error.message : error);
  }

  const result = await loader();
  try {
    await ensureConnected();
    await redis.set(key, JSON.stringify(result), 'EX', env.REPORT_CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn('[redis] Cache write skipped:', error instanceof Error ? error.message : error);
  }
  return result;
}

export async function invalidateUserReportCache(userId: string): Promise<void> {
  try {
    await ensureConnected();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `reports:${userId}:*`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) await redis.unlink(...keys);
    } while (cursor !== '0');
  } catch (error) {
    console.warn('[redis] Cache invalidation skipped:', error instanceof Error ? error.message : error);
  }
}
