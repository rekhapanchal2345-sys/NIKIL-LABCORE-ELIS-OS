import { Request, Response } from "express";
import { cacheService, CacheTags } from "./cache.service";

export class CacheController {
  /**
   * GET /api/cache/metrics
   * Inspect cache health, hit ratio, total operations, and active storage driver
   */
  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = cacheService.getMetrics();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve cache metrics",
      });
    }
  }

  /**
   * POST /api/cache/invalidate-tag
   * Clear all cached keys under a logical tag (e.g. 'catalog', 'reference_ranges')
   */
  public async invalidateTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.body;
      if (!tag || typeof tag !== "string") {
        res.status(400).json({
          success: false,
          error: "Tag string parameter is required",
        });
        return;
      }

      const invalidatedCount = await cacheService.invalidateTag(tag);
      res.json({
        success: true,
        message: `Successfully invalidated cache tag '${tag}'`,
        invalidatedCount,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to invalidate cache tag",
      });
    }
  }

  /**
   * POST /api/cache/flush
   * Flush entire cache (Super Admin only)
   */
  public async flushAll(req: Request, res: Response): Promise<void> {
    try {
      await cacheService.flushAll();
      cacheService.resetMetrics();
      res.json({
        success: true,
        message: "Successfully flushed all cache entries and reset metrics",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to flush cache",
      });
    }
  }
}

export const cacheController = new CacheController();
