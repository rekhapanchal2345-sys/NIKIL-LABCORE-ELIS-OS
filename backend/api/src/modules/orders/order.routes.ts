import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  list,
  getOne,
  update,
  collect,
  cancel,
  analytics,
  tatAnalytics,
  hourlyThroughput,
  pipeline,
  revenueByDoctor,
  bulkEscalate,
  bulkStatus,
} from "./order.controller";

import {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  orderQuerySchema,
  collectSampleSchema,
  cancelOrderSchema,
} from "./order.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// ANALYTICS ENDPOINTS (before /:id to avoid route conflict)
// =======================================================

router.get(
  "/analytics",
  authorize(UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  analytics
);

router.get(
  "/analytics/tat",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  tatAnalytics
);

router.get(
  "/analytics/hourly",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST, UserRole.FRONT_DESK),
  hourlyThroughput
);

router.get(
  "/analytics/pipeline",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST, UserRole.FRONT_DESK),
  pipeline
);

router.get(
  "/analytics/revenue-by-doctor",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  revenueByDoctor
);

// =======================================================
// BULK OPERATIONS
// =======================================================

router.post(
  "/bulk/escalate-priority",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  bulkEscalate
);

router.post(
  "/bulk/update-status",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  bulkStatus
);

// =======================================================
// CREATE ORDER
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    body: createOrderSchema,
  }),
  create
);

// =======================================================
// LIST ORDERS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    query: orderQuerySchema,
  }),
  list
);

// =======================================================
// COUNT ORDERS
// =======================================================

router.get(
  "/count",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  list
);

// =======================================================
// GET ORDER
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    params: orderIdSchema,
  }),
  getOne
);

// =======================================================
// UPDATE ORDER
// =======================================================

router.patch(
  "/:id",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validate({
    params: orderIdSchema,
    body: updateOrderSchema,
  }),
  update
);

// =======================================================
// SAMPLE COLLECTION
// =======================================================

router.post(
  "/:id/collect-sample",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  validate({
    params: orderIdSchema,
    body: collectSampleSchema,
  }),
  collect
);

// =======================================================
// CANCEL ORDER
// =======================================================

router.post(
  "/:id/cancel",
  authorize(
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    params: orderIdSchema,
    body: cancelOrderSchema,
  }),
  cancel
);

export default router;