import Redis from 'ioredis';
import { config } from './config';
import { RATE_LIMIT } from '@lost-museum/shared';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

let connected = false;
async function ensureConnected(): Promise<boolean> {
  if (connected) return true;
  try {
    await redis.connect();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * スライディングウィンドウ・レートリミット（§4: 全アクション10回/分）。
 * Redis が使えない環境（テスト等）では常に許可する（フェイルオープン）。
 * @returns true=許可 / false=制限超過
 */
export async function checkRateLimit(
  playerId: string,
  limit: number = RATE_LIMIT.ACTIONS_PER_MINUTE,
  windowSeconds: number = RATE_LIMIT.WINDOW_SECONDS,
): Promise<boolean> {
  if (!(await ensureConnected())) return true;
  const now = Date.now();
  const key = `rl:${playerId}`;
  const windowStart = now - windowSeconds * 1000;

  const pipeline = redis.multi();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.zcard(key);
  pipeline.expire(key, windowSeconds);
  const res = await pipeline.exec();

  const count = (res?.[2]?.[1] as number) ?? 0;
  return count <= limit;
}
