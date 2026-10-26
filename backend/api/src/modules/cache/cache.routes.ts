import { Router } from "express";
import { cacheController } from "./cache.controller";
import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();

// Cache Telemetry & Invalidation Endpoints
router.get("/metrics", authenticate, (req, res) => cacheController.getMetrics(req, res));
router.post("/invalidate-tag", authenticate, (req, res) => cacheController.invalidateTag(req, res));
router.post("/flush", authenticate, (req, res) => cacheController.flushAll(req, res));

export default router;
