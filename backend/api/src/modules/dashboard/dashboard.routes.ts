import { Router } from "express";
import { authenticate } from "../../../middleware/auth";

import {
  getStats,
  getOrderStats,
  getSampleStatsData,
  getAttentionResults,
  getApprovalsQueue,
  getActivity,
  getPaymentStats,
  getTestStats,
  getMetrics,
  acknowledgePanic,
} from "./dashboard.controller";

const router = Router();

/**
 * All dashboard routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get("/stats", getStats);

/**
 * GET /api/dashboard/metrics
 * Get unified real-time hospital telemetry metrics
 */
router.get("/metrics", getMetrics);

/**
 * POST /api/dashboard/panic-readback
 * Record critical value panic telephonic read-back
 */
router.post("/panic-readback", acknowledgePanic);

/**
 * GET /api/dashboard/orders
 * Get order analytics
 */
router.get("/orders", getOrderStats);

/**
 * GET /api/dashboard/samples
 * Get sample statistics
 */
router.get("/samples", getSampleStatsData);

/**
 * GET /api/dashboard/results/attention
 * Get results requiring attention
 */
router.get("/results/attention", getAttentionResults);

/**
 * GET /api/dashboard/approvals/queue
 * Get approval queue
 */
router.get("/approvals/queue", getApprovalsQueue);

/**
 * GET /api/dashboard/activity
 * Get recent activity
 */
router.get("/activity", getActivity);

/**
 * GET /api/dashboard/payments
 * Get payment analytics
 */
router.get("/payments", getPaymentStats);

/**
 * GET /api/dashboard/tests
 * Get test analytics
 */
router.get("/tests", getTestStats);

export default router;