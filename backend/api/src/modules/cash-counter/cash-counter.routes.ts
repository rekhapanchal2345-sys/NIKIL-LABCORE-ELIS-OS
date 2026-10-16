import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  open,
  close,
  list,
  getOne,
  addMovement,
} from "./cash-counter.controller";

import {
  createCashCounterSchema,
  openCashCounterSchema,
  closeCashCounterSchema,
  cashMovementSchema,
  cashCounterIdSchema,
  cashCounterQuerySchema,
} from "./cash-counter.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE CASH COUNTER
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createCashCounterSchema,
  }),
  create
);

// =======================================================
// LIST CASH COUNTERS
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
    query: cashCounterQuerySchema,
  }),
  list
);

// =======================================================
// GET CASH COUNTER BY ID
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
    params: cashCounterIdSchema,
  }),
  getOne
);

// =======================================================
// OPEN CASH COUNTER
// =======================================================

router.post(
  "/open",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: openCashCounterSchema,
  }),
  open
);

// =======================================================
// CLOSE CASH COUNTER
// =======================================================

router.post(
  "/close",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: closeCashCounterSchema,
  }),
  close
);

// =======================================================
// ADD CASH MOVEMENT
// =======================================================

router.post(
  "/movement",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: cashMovementSchema,
  }),
  addMovement
);

export default router;