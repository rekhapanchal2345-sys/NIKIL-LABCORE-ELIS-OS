import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  updatePayment,
  list,
  getOne,
  updateOverdue,
  summary,
  createCorporate,
  listCorporate,
  updateBalance,
} from "./receivable.controller";

import {
  createReceivableSchema,
  updateReceivablePaymentSchema,
  receivableIdSchema,
  receivableQuerySchema,
  createCorporateAccountSchema,
  updateCorporateBalanceSchema,
  corporateQuerySchema,
} from "./receivable.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE RECEIVABLE
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createReceivableSchema,
  }),
  create
);

// =======================================================
// LIST RECEIVABLES
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
    query: receivableQuerySchema,
  }),
  list
);

// =======================================================
// GET RECEIVABLES SUMMARY
// =======================================================

router.get(
  "/summary",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  summary
);


// =======================================================
// UPDATE RECEIVABLE PAYMENT
// =======================================================

router.post(
  "/payment",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: updateReceivablePaymentSchema,
  }),
  updatePayment
);

// =======================================================
// UPDATE OVERDUE STATUS
// =======================================================

router.post(
  "/update-overdue",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  updateOverdue
);

// =======================================================
// CREATE CORPORATE ACCOUNT
// =======================================================

router.post(
  "/corporate",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createCorporateAccountSchema,
  }),
  createCorporate
);

// =======================================================
// LIST CORPORATE ACCOUNTS
// =======================================================

router.get(
  "/corporate",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: corporateQuerySchema,
  }),
  listCorporate
);

// =======================================================
// UPDATE CORPORATE BALANCE
// =======================================================

router.post(
  "/corporate/balance",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: updateCorporateBalanceSchema,
  }),
  updateBalance
);

// =======================================================
// GET RECEIVABLE BY ID
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
    params: receivableIdSchema,
  }),
  getOne
);

export default router;