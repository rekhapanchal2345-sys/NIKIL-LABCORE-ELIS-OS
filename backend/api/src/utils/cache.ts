/**
 * High-Performance Caching Layer for LabCore ELIS Backend
 * Backed by Redis with automatic resilient In-Memory LRU fallback.
 * Provides microsecond response times for frequently accessed datasets.
 */

import { cacheService, CacheTags, CacheKeys, CacheTTL } from "../modules/cache/cache.service";

export class CacheAdapter {
  public async get<T>(key: string): Promise<T | null> {
    return cacheService.get<T>(key);
  }

  public async set<T>(key: string, value: T, ttlSeconds: number = 30): Promise<void> {
    await cacheService.set<T>(key, value, ttlSeconds);
  }

  public async del(key: string): Promise<void> {
    await cacheService.del(key);
  }

  public async delPrefix(prefix: string): Promise<void> {
    await cacheService.del(prefix);
  }

  public async clear(): Promise<void> {
    await cacheService.flushAll();
  }

  public async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    return cacheService.remember<T>(key, ttlSeconds, fetcher);
  }

  public async invalidateTag(tag: string): Promise<number> {
    return cacheService.invalidateTag(tag);
  }

  public getMetrics() {
    return cacheService.getMetrics();
  }
}

export const cache = new CacheAdapter();
export { cacheService, CacheTags, CacheKeys, CacheTTL };
export default cache;
