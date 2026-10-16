import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  list,
  getOne,
  collect,
  receive,
  process,
  complete,
  reject,
  createTracking,
  getSampleTracking,
  getOrderTracking,
  getPatientTracking,
  getComprehensiveTracking,
} from "./sample.controller";

import type { AuthenticatedRequest } from "../../../middleware/auth";

import {
  createSampleSchema,
  sampleIdSchema,
  sampleQuerySchema,
  collectSampleSchema,
  receiveSampleSchema,
  rejectSampleSchema,
  processSampleSchema,
  completeSampleSchema,
} from "./sample.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE SAMPLE
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  validate({
    body: createSampleSchema,
  }),
  create
);

// =======================================================
// LIST SAMPLES
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    query: sampleQuerySchema,
  }),
  list
);

// =======================================================
// COUNT SAMPLES
// =======================================================

router.get(
  "/count",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  list
);

// =======================================================
// GET SAMPLE
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: sampleIdSchema,
  }),
  getOne
);

// =======================================================
// COLLECT SAMPLE
// =======================================================

router.post(
  "/:id/collect",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  validate({
    params: sampleIdSchema,
    body: collectSampleSchema,
  }),
  collect
);

// =======================================================
// RECEIVE SAMPLE
// =======================================================

router.post(
  "/:id/receive",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH
  ),
  validate({
    params: sampleIdSchema,
    body: receiveSampleSchema,
  }),
  receive as any
);

// =======================================================
// START PROCESSING
// =======================================================

router.post(
  "/:id/process",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH
  ),
  validate({
    params: sampleIdSchema,
    body: processSampleSchema,
  }),
  process as any
);

// =======================================================
// COMPLETE SAMPLE
// =======================================================

router.post(
  "/:id/complete",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH
  ),
  validate({
    params: sampleIdSchema,
    body: completeSampleSchema,
  }),
  complete as any
);

// =======================================================
// REJECT SAMPLE
// =======================================================

router.post(
  "/:id/reject",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: sampleIdSchema,
    body: rejectSampleSchema,
  }),
  reject
);

// =======================================================
// SAMPLE TRACKING HISTORY ROUTES
// =======================================================

// Create tracking event
router.post(
  "/:id/tracking",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: sampleIdSchema,
  }),
  createTracking
);

// Get sample tracking history
router.get(
  "/:id/tracking",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: sampleIdSchema,
  }),
  getSampleTracking
);

// Get order tracking history
router.get(
  "/order/:id/tracking",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  getOrderTracking
);

// Get patient tracking history
router.get(
  "/patient/:id/tracking",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  getPatientTracking
);

// Alias for frontend samplesApi.getPatientTracking: /api/samples/tracking/patient/:id
router.get(
  "/tracking/patient/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  getPatientTracking
);

// Get comprehensive patient tracking
router.get(
  "/patient/:id/comprehensive",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  getComprehensiveTracking
);

export default router;