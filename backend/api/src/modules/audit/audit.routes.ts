import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  create,
  list,
  getOne,
  recordHistory,
  userActivity,
  getMyActivity,
} from "./audit.controller";

import {
  auditIdSchema,
  auditQuerySchema,
  createAuditSchema,
} from "./audit.validation";

const router = Router();

// =======================================================
// ALL AUDIT ROUTES REQUIRE LOGIN
// =======================================================

router.use(
  authenticate
);

// =======================================================
// CREATE AUDIT LOG
// =======================================================

router.get(
  "/me",
  validate({
    query: auditQuerySchema,
  }),
  getMyActivity
);

// =======================================================
// Usually internal/system use
// =======================================================

router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate({
    body:
      createAuditSchema,
  }),
  create
);

// =======================================================
// LIST AUDIT LOGS
// =======================================================

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate({
    query:
      auditQuerySchema,
  }),
  list
);

// =======================================================
// RECORD HISTORY
// =======================================================

router.get(
  "/record/:recordId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  recordHistory
);

// =======================================================
// USER ACTIVITY
// =======================================================

router.get(
  "/user/:userId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  userActivity
);

// =======================================================
// GET AUDIT LOG
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate({
    params:
      auditIdSchema,
  }),
  getOne
);

export default router;