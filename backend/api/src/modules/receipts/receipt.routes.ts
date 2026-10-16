import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";
import {
  generate,
  getByPayment,
  getByNumber,
  getThermalReceiptText,
  markPrinted,
  markEmailed,
  markSmsed,
  reports,
  exportData,
} from "./receipt.controller";

/**
 * ISS-015: Receipt routes were missing entirely from app.ts.
 * The receipt.controller.ts and receipt.service.ts existed but were never reachable
 * via any API route, making receipt generation, printing, and reporting inaccessible.
 */
const router = Router();
router.use(authenticate);

// Generate a receipt for a payment
router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  generate
);

// Get receipt by payment ID
router.get(
  "/payment/:paymentId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  getByPayment
);

// Get receipt by receipt number
router.get(
  "/number/:receiptNumber",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  getByNumber
);

// Get thermal printer text for a receipt
router.get(
  "/:receiptId/thermal",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  getThermalReceiptText
);

// Mark receipt as printed
router.post(
  "/:receiptId/mark-printed",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  markPrinted
);

// Mark receipt as emailed
router.post(
  "/:receiptId/mark-emailed",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  markEmailed
);

// Mark receipt as SMS-sent
router.post(
  "/:receiptId/mark-smsed",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.FRONT_DESK
  ),
  markSmsed
);

// Payment reports
router.get(
  "/reports",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  reports
);

// Export payment data
router.get(
  "/export",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT
  ),
  exportData
);

export default router;
