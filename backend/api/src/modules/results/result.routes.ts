import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize, requirePermission } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  list,
  getOne,
  update,
  verify,
  approve,
  reject,
  publish,
  getMetrics,
  getTrend,
  acknowledgeCritical,
  amend,
  bulkVerify,
} from "./result.controller";

import {
  createResultSchema,
  updateResultSchema,
  resultIdSchema,
  resultQuerySchema,
  criticalAcknowledgmentSchema,
  amendmentSchema,
  bulkVerifySchema,
} from "./result.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE RESULT
// Lab Technician / Pathologist
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    body: createResultSchema,
  }),
  create
);

// =======================================================
// LIST RESULTS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    query: resultQuerySchema,
  }),
  list
);

// =======================================================
// COUNT RESULTS
// =======================================================

router.get(
  "/count",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  list
);

// =======================================================
// GET RESULTS METRICS
// =======================================================

router.get(
  "/metrics",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  getMetrics
);

// =======================================================
// GET RESULT TREND
// =======================================================

router.get(
  "/trend/:patientId/:testCode",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  getTrend
);

// =======================================================
// ACKNOWLEDGE CRITICAL VALUE
// =======================================================

router.post(
  "/:id/critical-acknowledge",
  authenticate,
  requirePermission("results:critical:acknowledge"),
  validate({
    body: criticalAcknowledgmentSchema,
  }),
  acknowledgeCritical
);

// =======================================================
// CREATE AMENDMENT
// =======================================================

router.post(
  "/:id/amend",
  authenticate,
  requirePermission("results:amend"),
  validate({
    body: amendmentSchema,
  }),
  amend
);

// =======================================================
// BULK VERIFY
// =======================================================

router.post(
  "/bulk-verify",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    body: bulkVerifySchema,
  }),
  bulkVerify
);

// =======================================================
// GET RESULT
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    params: resultIdSchema,
  }),
  getOne
);

// =======================================================
// UPDATE RESULT
// =======================================================

router.patch(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: resultIdSchema,
    body: updateResultSchema,
  }),
  update
);

// =======================================================
// VERIFY RESULT
// =======================================================

router.post(
  "/:id/verify",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: resultIdSchema,
  }),
  verify
);

// =======================================================
// APPROVE RESULT
// =======================================================

router.post(
  "/:id/approve",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: resultIdSchema,
  }),
  approve
);

// =======================================================
// REJECT RESULT
// =======================================================

router.post(
  "/:id/reject",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: resultIdSchema,
  }),
  reject
);

// =======================================================
// PUBLISH RESULT
// =======================================================

router.post(
  "/:id/publish",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: resultIdSchema,
  }),
  publish
);

export default router;