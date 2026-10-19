import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  pending,
  getOne,
  approveResult,
  rejectResult,
  publishResult,
  getMetrics,
  batchApproveResults,
  saveCriticalAck,
  getHistoryTrend,
} from "./approval.controller";

import {
  approvalIdSchema,
  approvalQuerySchema,
  rejectApprovalSchema,
  batchApproveSchema,
  criticalAckSchema,
} from "./approval.validation";

const router = Router();

router.use(authenticate);

const APPROVAL_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.PATHOLOGIST,
  UserRole.DOCTOR,
];

// =======================================================
// APPROVAL METRICS
// =======================================================

router.get(
  "/metrics",
  authorize(...APPROVAL_ROLES),
  getMetrics
);

// =======================================================
// PENDING APPROVALS
// =======================================================

router.get(
  "/",
  authorize(...APPROVAL_ROLES),
  validate({
    query: approvalQuerySchema,
  }),
  pending
);

router.get(
  "/pending",
  authorize(...APPROVAL_ROLES),
  validate({
    query: approvalQuerySchema,
  }),
  pending
);

// =======================================================
// BATCH APPROVE
// =======================================================

router.post(
  "/batch-approve",
  authorize(...APPROVAL_ROLES),
  validate({
    body: batchApproveSchema,
  }),
  batchApproveResults
);

// =======================================================
// APPROVAL DETAIL
// =======================================================

router.get(
  "/:id",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  getOne
);

// =======================================================
// HISTORICAL DELTA CHECK TREND
// =======================================================

router.get(
  "/:id/history",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  getHistoryTrend
);

// =======================================================
// CRITICAL VALUE CALL ACKNOWLEDGMENT
// =======================================================

router.post(
  "/:id/critical-ack",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
    body: criticalAckSchema,
  }),
  saveCriticalAck
);

// =======================================================
// APPROVE
// =======================================================

router.post(
  "/:id/approve",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  approveResult
);

// =======================================================
// SEND BACK FOR CORRECTION
// =======================================================

router.post(
  "/:id/reject",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
    body: rejectApprovalSchema,
  }),
  rejectResult
);

// =======================================================
// PUBLISH
// =======================================================

router.post(
  "/:id/publish",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  publishResult
);

export default router;

