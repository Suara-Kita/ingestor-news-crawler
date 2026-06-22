import Redis from 'ioredis';
import type { Config } from './types.js';

const DEDUP_TTL_SECONDS = 7 * 24 * 60 * 60;

let client: Redis | null = null;

export function getRedis(config: Config): Redis {
  if (!client) {
    client = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    client.on('connect', () => console.log('[redis] connected'));
    client.on('error', (err) => console.error('[redis] error:', err.message));
  }
  return client;
}

function dedupKey(articleId: string): string {
  return `seen:news_crawler:${Buffer.from(articleId).toString('base64url')}`;
}

export async function isAlreadySeen(redis: Redis, articleId: string): Promise<boolean> {
  const val = await redis.get(dedupKey(articleId));
  return val !== null;
}

export async function markSeen(redis: Redis, articleId: string): Promise<void> {
  await redis.setex(dedupKey(articleId), DEDUP_TTL_SECONDS, '1');
}

export async function pushToQueue(redis: Redis, queue: string, payload: string): Promise<void> {
  await redis.lpush(queue, payload);
}

export async function incrementCounter(redis: Redis, key: string): Promise<void> {
  await redis.incr(key);
}
