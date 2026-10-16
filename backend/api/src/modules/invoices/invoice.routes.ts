import { Router } from "express";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";
import prisma from "../../../config/database";

import {
  create,
  list,
  getOne,
  refreshPaymentStatus,
  remove,
  getMetrics,
  refund,
} from "./invoice.controller";

import {
  createInvoiceSchema,
  invoiceIdSchema,
  invoiceQuerySchema,
  billingMetricsQuerySchema,
  refundSchema,
} from "./invoice.validation";

const router = Router();

router.use(authenticate);

// =======================================================
// CREATE INVOICE
// =======================================================

router.post(
  "/",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK"
  ),
  validate({
    body: createInvoiceSchema,
  }),
  create
);

// =======================================================
// LIST INVOICES
// =======================================================

router.get(
  "/",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK",
    "PATHOLOGIST"
  ),
  validate({
    query: invoiceQuerySchema,
  }),
  list
);

// =======================================================
// COUNT INVOICES
// =======================================================

router.get(
  "/count",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK",
    "PATHOLOGIST"
  ),
  list
);

// =======================================================
// GET BILLING METRICS (Must precede /:id)
// =======================================================

router.get(
  "/metrics/billing",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK"
  ),
  validate({
    query: billingMetricsQuerySchema,
  }),
  getMetrics
);

// =======================================================
// PROCESS REFUND
// =======================================================

router.post(
  "/refund",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK"
  ),
  validate({
    body: refundSchema,
  }),
  refund
);

// =======================================================
// GET INVOICE PAYMENTS (Bug #060)
// =======================================================

router.get(
  "/:id/payments",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK",
    "PATHOLOGIST"
  ),
  async (req, res, next) => {
    try {
      const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          order: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: invoice.order?.payments || [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// =======================================================
// GET INVOICE
// =======================================================

router.get(
  "/:id",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK",
    "PATHOLOGIST"
  ),
  validate({
    params: invoiceIdSchema,
  }),
  getOne
);

// =======================================================
// REFRESH PAYMENT STATUS
// =======================================================

router.patch(
  "/:id/payment-status",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FRONT_DESK"
  ),
  validate({
    params: invoiceIdSchema,
  }),
  refreshPaymentStatus
);

// =======================================================
// DELETE INVOICE
// =======================================================

router.delete(
  "/:id",
  authorize(
    "ADMIN",
    "SUPER_ADMIN"
  ),
  validate({
    params: invoiceIdSchema,
  }),
  remove
);

export default router;