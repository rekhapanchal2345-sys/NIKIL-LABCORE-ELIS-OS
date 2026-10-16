import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  process,
  list,
  getOne,
  createReconciliation,
  reconcile,
  listReconciliations,
  summary,
} from "./settlement.controller";

import {
  createSettlementSchema,
  processSettlementSchema,
  createReconciliationSchema,
  reconcileSchema,
  settlementIdSchema,
  settlementQuerySchema,
  reconciliationQuerySchema,
} from "./settlement.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE SETTLEMENT
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createSettlementSchema,
  }),
  create
);

// =======================================================
// LIST SETTLEMENTS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: settlementQuerySchema,
  }),
  list
);

// =======================================================
// GET SETTLEMENT SUMMARY
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
// PROCESS SETTLEMENT
// =======================================================

router.post(
  "/process",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: processSettlementSchema,
  }),
  process
);

// =======================================================
// CREATE RECONCILIATION RECORD
// =======================================================

router.post(
  "/reconciliation",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: createReconciliationSchema,
  }),
  createReconciliation
);

// =======================================================
// LIST RECONCILIATION RECORDS
// =======================================================

router.get(
  "/reconciliation",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: reconciliationQuerySchema,
  }),
  listReconciliations
);

router.get(
  "/reconciliation/list",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: reconciliationQuerySchema,
  }),
  listReconciliations
);

router.get(
  "/reconcile/list",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    query: reconciliationQuerySchema,
  }),
  listReconciliations
);

// =======================================================
// RECONCILE TRANSACTIONS
// =======================================================

router.post(
  "/reconciliation/reconcile",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: reconcileSchema,
  }),
  reconcile
);

// Direct reconcile alias for frontend settlementsApi.reconcile
router.post(
  "/reconcile",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    body: reconcileSchema,
  }),
  reconcile
);

// =======================================================
// GET SETTLEMENT BY ID
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  validate({
    params: settlementIdSchema,
  }),
  getOne
);

export default router;