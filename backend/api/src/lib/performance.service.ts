/**
 * Performance Benchmarking and Telemetry Engine for LabCore ELIS
 * Calculates microsecond P50, P95, and P99 latency distributions,
 * audits N+1 query elimination, and tracks PostgreSQL connection pool utilization.
 */

import { pool } from "../../config/database";

export interface LatencyDistribution {
  count: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  under200msPercent: number;
}

export interface BenchmarkReport {
  operationName: string;
  iterations: number;
  concurrency: number;
  distribution: LatencyDistribution;
  passedP95Target: boolean; // P95 < 200ms
  timestamp: string;
}

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  maxConfigured: number;
  minConfigured: number;
}

export class PerformanceService {
  /**
   * Calculate exact statistical percentiles for latency measurements
   */
  public calculatePercentiles(durationsMs: number[]): LatencyDistribution {
    if (durationsMs.length === 0) {
      return {
        count: 0,
        minMs: 0,
        maxMs: 0,
        avgMs: 0,
        p50Ms: 0,
        p90Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        under200msPercent: 100,
      };
    }

    const sorted = [...durationsMs].sort((a, b) => a - b);
    const count = sorted.length;
    const minMs = Number(sorted[0].toFixed(2));
    const maxMs = Number(sorted[count - 1].toFixed(2));
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avgMs = Number((sum / count).toFixed(2));

    const getPercentile = (p: number): number => {
      const idx = Math.min(Math.floor((p / 100) * count), count - 1);
      return Number(sorted[idx].toFixed(2));
    };

    const under200Count = sorted.filter((d) => d <= 200).length;
    const under200msPercent = Number(((under200Count / count) * 100).toFixed(2));

    return {
      count,
      minMs,
      maxMs,
      avgMs,
      p50Ms: getPercentile(50),
      p90Ms: getPercentile(90),
      p95Ms: getPercentile(95),
      p99Ms: getPercentile(99),
      under200msPercent,
    };
  }

  /**
   * Run high-concurrency benchmark on any async routine
   */
  public async benchmark(
    name: string,
    iterations: number,
    fn: (index: number) => Promise<any>,
    concurrency: number = 5
  ): Promise<BenchmarkReport> {
    const durations: number[] = [];
    const queue = Array.from({ length: iterations }, (_, i) => i);

    const worker = async () => {
      while (queue.length > 0) {
        const idx = queue.shift();
        if (idx === undefined) break;

        const start = performance.now();
        await fn(idx);
        const duration = performance.now() - start;
        durations.push(duration);
      }
    };

    // Execute concurrently up to specified concurrency pool
    const workers = Array.from({ length: Math.min(concurrency, iterations) }, () => worker());
    await Promise.all(workers);

    const distribution = this.calculatePercentiles(durations);

    return {
      operationName: name,
      iterations,
      concurrency,
      distribution,
      passedP95Target: distribution.p95Ms <= 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Inspect live PostgreSQL connection pool saturation
   */
  public getPoolStats(): PoolStats {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      maxConfigured: Number(process.env.DB_POOL_MAX || 20),
      minConfigured: Number(process.env.DB_POOL_MIN || 2),
    };
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
