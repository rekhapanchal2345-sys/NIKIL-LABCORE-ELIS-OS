import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate, requireOwnerToken } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  approve,
  reject,
  process,
  list,
  getOne,
} from "./refund.controller";

import {
  createRefundSchema,
  approveRefundSchema,
  rejectRefundSchema,
  processRefundSchema,
  refundIdSchema,
  refundQuerySchema,
} from "./refund.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE REFUND REQUEST
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createRefundSchema,
  }),
  create
);

// =======================================================
// LIST REFUNDS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: refundQuerySchema,
  }),
  list
);

// =======================================================
// GET REFUND BY ID
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    params: refundIdSchema,
  }),
  getOne
);

// =======================================================
// APPROVE REFUND
// =======================================================

router.post(
  "/approve",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  requireOwnerToken,
  validate({
    body: approveRefundSchema,
  }),
  approve
);

// =======================================================
// REJECT REFUND
// =======================================================

router.post(
  "/reject",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  requireOwnerToken,
  validate({
    body: rejectRefundSchema,
  }),
  reject
);

// =======================================================
// PROCESS REFUND
// =======================================================

router.post(
  "/process",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  requireOwnerToken,
  validate({
    body: processRefundSchema,
  }),
  process
);

export default router;
