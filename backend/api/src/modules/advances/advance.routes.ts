import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  getAdvances,
  getWallet,
  applyToInvoice,
  refund,
} from "./advance.controller";

import {
  createAdvanceSchema,
  applyAdvanceSchema,
  refundAdvanceSchema,
  patientIdSchema,
} from "./advance.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE ADVANCE
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
    body: createAdvanceSchema,
  }),
  create
);

// =======================================================
// GET PATIENT ADVANCES
// =======================================================

router.get(
  "/patient/:patientId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    params: patientIdSchema,
  }),
  getAdvances
);

// =======================================================
// GET PATIENT WALLET
// =======================================================

router.get(
  "/wallet/:patientId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    params: patientIdSchema,
  }),
  getWallet
);

// =======================================================
// APPLY ADVANCE TO INVOICE
// =======================================================

router.post(
  "/apply",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: applyAdvanceSchema,
  }),
  applyToInvoice
);

// =======================================================
// REFUND ADVANCE
// =======================================================

router.post(
  "/refund",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: refundAdvanceSchema,
  }),
  refund
);

export default router;