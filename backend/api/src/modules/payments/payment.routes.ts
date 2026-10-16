import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  createSplit,
  list,
  getOne,
  refund,
  metrics,
  shiftClose,
} from "./payment.controller";

import {
  createPaymentSchema,
  createSplitPaymentSchema,
  paymentIdSchema,
  paymentQuerySchema,
} from "./payment.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE PAYMENT
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    body: createPaymentSchema,
  }),
  create
);

// =======================================================
// CREATE SPLIT PAYMENT
// =======================================================

router.post(
  "/split",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    body: createSplitPaymentSchema,
  }),
  createSplit
);

// =======================================================
// LIST PAYMENTS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    query: paymentQuerySchema,
  }),
  list
);

// =======================================================
// COUNT PAYMENTS
// =======================================================

router.get(
  "/count",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  list
);

// =======================================================
// METRICS
// =======================================================

router.get(
  "/metrics",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  metrics
);

// =======================================================
// SHIFT CLOSE REPORT
// =======================================================

router.get(
  "/shift-close",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  shiftClose
);

// =======================================================
// GET PAYMENT
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK
  ),
  validate({
    params: paymentIdSchema,
  }),
  getOne
);

// =======================================================
// REFUND
// =======================================================

router.post(
  "/:id/refund",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate({
    params: paymentIdSchema,
  }),
  refund
);

export default router;