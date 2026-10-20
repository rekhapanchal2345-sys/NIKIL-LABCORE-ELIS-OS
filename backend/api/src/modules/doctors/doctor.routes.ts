import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import * as controller from "./doctor.controller";

import {
  createDoctorSchema,
  updateDoctorSchema,
  doctorIdSchema,
  doctorQuerySchema,
  archiveDoctorSchema,
  payoutSchema,
  statusSchema,
  organizationSchema,
  documentSchema,
} from "./doctor.validation";

const router = Router();

// All doctor routes require authentication.
router.use(authenticate);

// -----------------------------------------------------------------
// Role policy
//   ADMIN / SUPER_ADMIN / BRANCH_ADMIN : full control
//   FRONT_DESK                          : add + edit + view
//   ACCOUNTANT                          : payouts only
//   LAB_TECH / PATHOLOGIST / DOCTOR     : read only
// -----------------------------------------------------------------
const ADMINS = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
] as const;
const CAN_MANAGE = [...ADMINS, UserRole.FRONT_DESK] as const;
const CAN_READ = [
  ...ADMINS,
  UserRole.FRONT_DESK,
  UserRole.LAB_TECH,
  UserRole.PATHOLOGIST,
  UserRole.DOCTOR,
  UserRole.ACCOUNTANT,
] as const;
const PAYOUT_ROLES = [...ADMINS, UserRole.ACCOUNTANT, UserRole.FRONT_DESK] as const;

// -----------------------------------------------------------------
// Static paths MUST come before "/:id" so they are not swallowed.
// -----------------------------------------------------------------

/* Payouts — doctors who still owe money (Pending Payouts tab). */
router.get(
  "/payouts/pending",
  authorize(...PAYOUT_ROLES),
  controller.pendingPayouts
);

/* Lightweight search for "Referred By" dropdowns. */
router.get(
  "/search",
  authorize(...CAN_READ),
  controller.search
);

/* Hospital / clinic partner organisations. */
router.get(
  "/organizations",
  authorize(...CAN_READ),
  controller.orgList
);
router.post(
  "/organizations",
  authorize(...ADMINS),
  validate({ body: organizationSchema }),
  controller.orgCreate
);
router.patch(
  "/organizations/:id",
  authorize(...ADMINS),
  validate({ body: organizationSchema }),
  controller.orgUpdate
);

router.get(
  "/specialization/:specialization",
  authorize(...CAN_READ),
  controller.bySpecialization
);

router.get(
  "/count",
  authorize(...CAN_READ),
  validate({ query: doctorQuerySchema }),
  controller.list
);

/* -----------------------------------------------------------------
 * LIST — server-side filters, sort, pagination + KPI totals
 * ----------------------------------------------------------------- */
router.get(
  "/",
  authorize(...CAN_READ),
  validate({ query: doctorQuerySchema }),
  controller.list
);

/* CREATE */
router.post(
  "/",
  authorize(...CAN_MANAGE),
  validate({ body: createDoctorSchema }),
  controller.create
);

/* -----------------------------------------------------------------
 * Per-doctor sub-resources
 * ----------------------------------------------------------------- */
router.get(
  "/:id/referrals",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.referralHistory
);
router.get(
  "/:id/ledger",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.ledger
);
router.get(
  "/:id/payout-history",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.payouts
);
router.get(
  "/:id/trend",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.trend
);
router.get(
  "/:id/documents",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.documents
);
router.post(
  "/:id/documents",
  authorize(...CAN_MANAGE),
  validate({ params: doctorIdSchema, body: documentSchema }),
  controller.uploadDocument
);
router.get(
  "/:id/activity",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.activity
);

router.get(
  "/:id/statistics",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.statistics
);
router.get(
  "/:id/commission",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.commission
);

/* Payout settlement — finance + admins. */
router.post(
  "/:id/payout",
  authorize(...PAYOUT_ROLES),
  validate({ params: doctorIdSchema, body: payoutSchema }),
  controller.processPayout
);

router.get(
  "/:id",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.getOne
);

router.patch(
  "/:id",
  authorize(...CAN_MANAGE),
  validate({ params: doctorIdSchema, body: updateDoctorSchema }),
  controller.update
);

router.patch(
  "/:id/status",
  authorize(...ADMINS),
  validate({ params: doctorIdSchema, body: statusSchema }),
  controller.updateStatus
);

/* Archive (soft delete) — history is always preserved. */
router.post(
  "/:id/archive",
  authorize(...ADMINS),
  validate({ params: doctorIdSchema, body: archiveDoctorSchema }),
  controller.archive
);
router.post(
  "/:id/restore",
  authorize(...ADMINS),
  validate({ params: doctorIdSchema }),
  controller.restore
);

/* Legacy DELETE — routes to archive; hard delete is refused. */
router.delete(
  "/:id",
  authorize(...ADMINS),
  validate({ params: doctorIdSchema }),
  controller.remove
);

router.post(
  "/:id/photo",
  authorize(...CAN_MANAGE),
  validate({ params: doctorIdSchema }),
  controller.uploadPhoto
);

router.post(
  "/:id/signature",
  authorize(...CAN_MANAGE),
  validate({ params: doctorIdSchema }),
  controller.uploadSignature
);

router.get(
  "/:id/seal",
  authorize(...CAN_READ),
  validate({ params: doctorIdSchema }),
  controller.getSeal
);

export default router;