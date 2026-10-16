import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate as validateRequest } from "../../../middleware/validate.middleware";

import {
  generateOrder,
  generateSample,
  generatePatient,
  validate as validateBarcode,
  getPrintData,
  generateBatch,
  regenerate,
  scanBarcode,
} from "./barcode.controller";

import { z } from "zod";

const router = Router();

router.use(authenticate);

// Validation schemas
const barcodeSchema = z.object({
  barcode: z.string().min(1),
});

const batchBarcodeSchema = z.object({
  orderIds: z.array(z.string().cuid()).min(1),
});

const scanBarcodeSchema = z.object({
  barcode: z.string().min(1),
});

// =======================================================
// GENERATE BARCODES
// =======================================================

// Generate order barcode
router.post(
  "/order/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  generateOrder
);

// Generate sample barcode
router.post(
  "/sample/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  generateSample
);

// Generate patient barcode
router.post(
  "/patient/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  generatePatient
);

// =======================================================
// VALIDATE BARCODES
// =======================================================

// Validate barcode
router.get(
  "/validate/:barcode",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validateBarcode
);

// Scan barcode (for barcode scanners)
router.post(
  "/scan",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  validateRequest({
    body: scanBarcodeSchema,
  }),
  scanBarcode
);

// =======================================================
// BARCODE PRINTING
// =======================================================

// Get barcode print data
router.get(
  "/print/:barcode",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  getPrintData
);

// =======================================================
// BATCH OPERATIONS
// =======================================================

// Generate batch barcodes
router.post(
  "/batch",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  validateRequest({
    body: batchBarcodeSchema,
  }),
  generateBatch
);

// =======================================================
// BARCODE MANAGEMENT
// =======================================================

// Regenerate barcode
router.post(
  "/regenerate/:type/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH
  ),
  regenerate
);

export default router;