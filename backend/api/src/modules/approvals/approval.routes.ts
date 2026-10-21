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
  getSignature,
  verifySignature,
  getApprovalQcChart,
  getTestQcChart,
  amendResult,
  getAmendments,
  getTriageQueue,
  getPanicReadBackLedger,
  recordPanicReadBack,
  checkOrderDispatchStatus,
} from "./approval.controller";

import {
  approvalIdSchema,
  approvalQuerySchema,
  rejectApprovalSchema,
  batchApproveSchema,
  criticalAckSchema,
  amendResultSchema,
  panicReadBackSchema,
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
// PANIC TRIAGE QUEUE & AUDIT LEDGER (BEFORE /:id)
// =======================================================

router.get(
  "/triage/queue",
  authorize(...APPROVAL_ROLES),
  getTriageQueue
);

router.get(
  "/panic-triage/ledger",
  authorize(...APPROVAL_ROLES),
  getPanicReadBackLedger
);

router.post(
  "/panic-triage/readback",
  authorize(...APPROVAL_ROLES),
  validate({
    body: panicReadBackSchema,
  }),
  recordPanicReadBack
);

router.get(
  "/panic-triage/dispatch-status/:orderId",
  authorize(...APPROVAL_ROLES),
  checkOrderDispatchStatus
);

// =======================================================
// LEVEY-JENNINGS QC BY TEST CODE (BEFORE /:id)
// =======================================================

router.get(
  "/qc-chart/:testCode",
  authorize(...APPROVAL_ROLES),
  getTestQcChart
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

// =======================================================
// DIGITAL SIGNATURE & VERIFICATION
// =======================================================

router.get(
  "/:id/signature",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  getSignature
);

router.get(
  "/:id/verify-signature",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  verifySignature
);

// =======================================================
// LEVEY-JENNINGS QC FOR APPROVAL SPECIMEN
// =======================================================

router.get(
  "/:id/qc-chart",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  getApprovalQcChart
);

// =======================================================
// RESULT AMENDMENT (NABL ISO 15189:2022)
// =======================================================

router.post(
  "/:id/amend",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
    body: amendResultSchema,
  }),
  amendResult
);

router.get(
  "/:id/amendments",
  authorize(...APPROVAL_ROLES),
  validate({
    params: approvalIdSchema,
  }),
  getAmendments
);

export default router;


