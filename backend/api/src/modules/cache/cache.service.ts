/**
 * Enterprise High-Throughput Caching Service for LabCore ELIS
 * Supports Redis (via ioredis) with high-speed In-Memory LRU fallback.
 * Provides microsecond read latency (<2ms) for hot clinical data (Catalogs, Reference Ranges, Settings).
 */

import Redis from "ioredis";

export interface CacheMetrics {
  hits: number;
  misses: number;
  writes: number;
  deletes: number;
  evictions: number;
  tagInvalidations: number;
  hitRatioPercentage: number;
  totalRequests: number;
  driver: "redis" | "memory";
  redisConnected: boolean;
  activeEntriesCount: number;
  avgReadLatencyMs: number;
}

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number | null; // null = never expires
  tags: Set<string>;
  lastAccessed: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private isRedisReady: boolean = false;
  private readonly defaultPrefix = "lis:";
  private readonly maxMemoryEntries = 10000;

  // In-memory LRU fallback storage
  private memoryStore = new Map<string, MemoryCacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> Set of keys
  private inFlight = new Map<string, Promise<any>>(); // Singleflight stampede prevention
  private memoryCleanupTimer: NodeJS.Timeout | null = null;

  // Metrics telemetry
  private metrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    deletes: 0,
    evictions: 0,
    tagInvalidations: 0,
    totalReadTimeMs: 0,
    totalReads: 0,
  };

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL;
    this.initRedis(url);
    this.initMemoryCleanup();
  }

  /**
   * Initialize Redis with graceful degradation to in-memory mode
   */
  private initRedis(url?: string): void {
    const targetUrl = url || "redis://localhost:6379";
    try {
      this.redis = new Redis(targetUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts, stay in memory mode
          }
          return Math.min(times * 300, 1500);
        },
      });

      this.redis.on("connect", () => {
        this.isRedisReady = true;
      });

      this.redis.on("ready", () => {
        this.isRedisReady = true;
      });

      this.redis.on("error", (err) => {
        this.isRedisReady = false;
      });

      this.redis.on("close", () => {
        this.isRedisReady = false;
      });

      // Attempt async connection without blocking application startup
      this.redis.connect().catch(() => {
        this.isRedisReady = false;
      });
    } catch {
      this.redis = null;
      this.isRedisReady = false;
    }
  }

  private initMemoryCleanup(): void {
    if (typeof setInterval !== "undefined") {
      this.memoryCleanupTimer = setInterval(() => {
        this.purgeExpiredMemory();
      }, 30000); // Check every 30s
      if (this.memoryCleanupTimer.unref) {
        this.memoryCleanupTimer.unref();
      }
    }
  }

  private formatKey(key: string): string {
    return key.startsWith(this.defaultPrefix) ? key : `${this.defaultPrefix}${key}`;
  }

  /**
   * Get an item from cache (Redis or In-Memory)
   */
  public async get<T>(rawKey: string): Promise<T | null> {
    const start = performance.now();
    const key = this.formatKey(rawKey);

    try {
      if (this.isRedisReady && this.redis) {
        const val = await this.redis.get(key);
        const duration = performance.now() - start;
        this.recordReadMetric(duration);

        if (val !== null) {
          this.metrics.hits++;
          return JSON.parse(val) as T;
        } else {
          this.metrics.misses++;
          return null;
        }
      }
    } catch {
      // Degrade to memory cache on Redis error
    }

    // In-Memory lookup
    const entry = this.memoryStore.get(key);
    const duration = performance.now() - start;
    this.recordReadMetric(duration);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      this.deleteFromMemory(key);
      this.metrics.misses++;
      return null;
    }

    entry.lastAccessed = now;
    this.metrics.hits++;
    return entry.value as T;
  }

  /**
   * Set an item in cache with optional TTL and invalidation tags
   */
  public async set<T>(
    rawKey: string,
    value: T,
    ttlSeconds?: number,
    tags?: string[]
  ): Promise<boolean> {
    const key = this.formatKey(rawKey);
    this.metrics.writes++;

    // 1. Try Redis
    if (this.isRedisReady && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
          await this.redis.set(key, serialized, "EX", ttlSeconds);
        } else {
          await this.redis.set(key, serialized);
        }

        // Index tags in Redis sets
        if (tags && tags.length > 0) {
          const pipeline = this.redis.pipeline();
          for (const tag of tags) {
            const tagKey = `${this.defaultPrefix}tag:${tag}`;
            pipeline.sadd(tagKey, key);
            if (ttlSeconds && ttlSeconds > 0) {
              pipeline.expire(tagKey, Math.max(ttlSeconds * 2, 86400));
            }
          }
          await pipeline.exec();
        }
        return true;
      } catch {
        // Fall back to memory
      }
    }

    // 2. In-Memory fallback
    this.ensureMemoryCapacity();

    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    const tagSet = new Set<string>(tags || []);

    this.memoryStore.set(key, {
      value,
      expiresAt,
      tags: tagSet,
      lastAccessed: Date.now(),
    });

    // Index tags in memory
    for (const tag of tagSet) {
      let keysForTag = this.tagIndex.get(tag);
      if (!keysForTag) {
        keysForTag = new Set<string>();
        this.tagIndex.set(tag, keysForTag);
      }
      keysForTag.add(key);
    }

    return true;
  }

  /**
   * Delete an item by key
   */
  public async del(rawKey: string): Promise<boolean> {
    const key = this.formatKey(rawKey);
    this.metrics.deletes++;

    let deleted = false;
    if (this.isRedisReady && this.redis) {
      try {
        const res = await this.redis.del(key);
        deleted = res > 0;
      } catch {
        // Memory fallback
      }
    }

    if (this.deleteFromMemory(key)) {
      deleted = true;
    }

    return deleted;
  }

  /**
   * Check if a key exists and has not expired
   */
  public async has(rawKey: string): Promise<boolean> {
    const key = this.formatKey(rawKey);
    if (this.isRedisReady && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch {}
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.deleteFromMemory(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate all keys matching a specific logical tag (e.g. 'tag:catalog')
   */
  public async invalidateTag(tag: string): Promise<number> {
    let count = 0;
    this.metrics.tagInvalidations++;

    // Redis tag invalidation
    if (this.isRedisReady && this.redis) {
      try {
        const tagKey = `${this.defaultPrefix}tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          for (const k of keys) {
            pipeline.del(k);
          }
          pipeline.del(tagKey);
          await pipeline.exec();
          count += keys.length;
        }
      } catch {}
    }

    // Memory tag invalidation
    const keysInTag = this.tagIndex.get(tag);
    if (keysInTag) {
      for (const k of keysInTag) {
        if (this.deleteFromMemory(k)) {
          count++;
        }
      }
      this.tagIndex.delete(tag);
    }

    return count;
  }

  /**
   * Invalidate multiple tags in one atomic batch
   */
  public async invalidateTags(tags: string[]): Promise<number> {
    let total = 0;
    for (const tag of tags) {
      total += await this.invalidateTag(tag);
    }
    return total;
  }

  /**
   * Transparent cache loader pattern with Singleflight stampede prevention:
   * Returns cached data or coalesces simultaneous requests into a single DB execution.
   */
  /**
   * Transparent cache loader pattern with synchronous Singleflight stampede prevention:
   * Returns cached data or coalesces simultaneous requests into a single DB execution.
   */
  public async remember<T>(
    rawKey: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    tags?: string[]
  ): Promise<T> {
    const key = this.formatKey(rawKey);

    // 1. If an identical loader is currently in-flight, join it immediately (synchronous check)
    const existingFlight = this.inFlight.get(key);
    if (existingFlight) {
      this.metrics.hits++;
      return existingFlight as Promise<T>;
    }

    // 2. Synchronous in-memory cache check (zero microtask yields)
    const memEntry = this.memoryStore.get(key);
    if (memEntry && (memEntry.expiresAt === null || Date.now() <= memEntry.expiresAt)) {
      memEntry.lastAccessed = Date.now();
      this.metrics.hits++;
      return memEntry.value as T;
    }

    // 3. Register in-flight promise synchronously BEFORE any async yield
    const loadPromise = (async () => {
      try {
        // If Redis is active, check Redis first
        if (this.isRedisReady && this.redis) {
          try {
            const redisVal = await this.redis.get(key);
            if (redisVal !== null) {
              this.metrics.hits++;
              return JSON.parse(redisVal) as T;
            }
          } catch {}
        }

        // Cache miss: execute expensive loader
        this.metrics.misses++;
        const fresh = await loader();
        if (fresh !== null && fresh !== undefined) {
          await this.set(rawKey, fresh, ttlSeconds, tags);
        }
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Clear all keys managed by this cache service
   */
  public async flushAll(): Promise<void> {
    if (this.isRedisReady && this.redis) {
      try {
        const keys = await this.redis.keys(`${this.defaultPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch {}
    }

    this.memoryStore.clear();
    this.tagIndex.clear();
  }

  /**
   * Retrieve performance metrics and cache statistics
   */
  public getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRatioPercentage =
      totalRequests > 0 ? Number(((this.metrics.hits / totalRequests) * 100).toFixed(2)) : 0;
    const avgReadLatencyMs =
      this.metrics.totalReads > 0
        ? Number((this.metrics.totalReadTimeMs / this.metrics.totalReads).toFixed(3))
        : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      writes: this.metrics.writes,
      deletes: this.metrics.deletes,
      evictions: this.metrics.evictions,
      tagInvalidations: this.metrics.tagInvalidations,
      hitRatioPercentage,
      totalRequests,
      driver: this.isRedisReady ? "redis" : "memory",
      redisConnected: this.isRedisReady,
      activeEntriesCount: this.memoryStore.size,
      avgReadLatencyMs,
    };
  }

  public resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      evictions: 0,
      tagInvalidations: 0,
      totalReadTimeMs: 0,
      totalReads: 0,
    };
  }

  // --- Internal Memory Management Helpers ---

  private recordReadMetric(durationMs: number): void {
    this.metrics.totalReads++;
    this.metrics.totalReadTimeMs += durationMs;
  }

  private deleteFromMemory(key: string): boolean {
    const entry = this.memoryStore.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    this.memoryStore.delete(key);
    return true;
  }

  private ensureMemoryCapacity(): void {
    if (this.memoryStore.size >= this.maxMemoryEntries) {
      // LRU Eviction: find the oldest accessed key
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, v] of this.memoryStore.entries()) {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.deleteFromMemory(oldestKey);
        this.metrics.evictions++;
      }
    }
  }

  private purgeExpiredMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.deleteFromMemory(key);
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
      this.memoryCleanupTimer = null;
    }
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
      this.redis = null;
      this.isRedisReady = false;
    }
  }
}

/**
 * Standard Clinical LIS Key Factories & Invalidation Tags
 */
export const CacheTags = {
  CATALOG: "catalog",
  RANGES: "reference_ranges",
  SETTINGS: "laboratory_settings",
  BRANCHES: "branches",
  DOCTORS: "doctors",
  ANALYTICS: "analytics",
} as const;

export const CacheKeys = {
  testCatalog: (params?: { categoryId?: string; search?: string }) =>
    `catalog:tests:${params?.categoryId || "all"}:${params?.search || "none"}`,
  testById: (id: string) => `catalog:test:${id}`,
  testCategories: () => `catalog:categories:active`,
  referenceRanges: (parameterId: string) => `ranges:param:${parameterId}`,
  laboratorySettings: () => `settings:laboratory:global`,
  branchConfig: (branchId: string) => `branches:config:${branchId}`,
  activeDoctors: (branchId?: string) => `doctors:active:${branchId || "all"}`,
  worklistQueue: (branchId: string) => `worklist:queue:${branchId}`,
};

export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  TWO_HOURS: 7200,
  ONE_DAY: 86400,
};

// Singleton export
export const cacheService = new CacheService();
export default cacheService;
