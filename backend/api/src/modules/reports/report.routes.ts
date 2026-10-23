import { Router, Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../../../config/database";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";
import { pathParam } from "../../utils/request-meta";

import {
  orderReport,
  patientReports,
  publishedReports,
  summary,
  createAddendum,
  applySignature,
  inlineApprove,
  inlineReject,
  generateShareLink,
  validateShareLink,
  revokeShareLink,
  addToHistory,
  patientTimeline,
  amendReportHandler,
  sendReportToDoctorHandler,
  orderReportPdf,
  getOrderReportHtmlPreview,
  downloadOrderReportPdf,
  publicVerifyReport,
  generateReportHandler,
  sendReportWhatsAppHandler,
  sendReportEmailHandler,
  printReportHandler,
  generateAndStoreReport,
  streamStoredOrderReportFile,
  verifyQrCryptographicToken,
  batchPrintReports,
  getAddendums,
  bulkDispatchHandler,
  reportController,
} from "./report.controller";

import {
  orderReportSchema,
  patientReportSchema,
  reportQuerySchema,
  addendumSchema,
  signatureSchema,
  inlineApproveSchema,
  inlineRejectSchema,
  shareLinkSchema,
  patientHistorySchema,
  amendSchema,
  sendDoctorSchema,
} from "./report.validation";

const router = Router();

// =======================================================
// PUBLIC REPORT VERIFICATION (UNAUTHENTICATED FOR QR SCAN)
// =======================================================

router.get("/public/verify/:reportId", publicVerifyReport);
router.get("/verify/:reportId", publicVerifyReport);
router.get("/verify-token", verifyQrCryptographicToken);

router.use(
  authenticate
);

router.post("/batch-print", batchPrintReports);
router.get("/order/:orderId/file", streamStoredOrderReportFile);
router.post("/order/:orderId/generate", generateAndStoreReport);

// =======================================================
// GENERATE & BULK DISPATCH
// =======================================================

router.post(
  "/generate",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  generateReportHandler
);

router.post(
  "/bulk-dispatch",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST
  ),
  bulkDispatchHandler
);

// =======================================================
// REPORT SUMMARY
// =======================================================

router.get(
  "/summary",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  summary
);

// =======================================================
// PUBLISHED REPORTS
// =======================================================

router.get(
  "/published",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    query: reportQuerySchema,
  }),
  publishedReports
);

router.get(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    query: reportQuerySchema,
  }),
  publishedReports
);

router.get(
  "/count",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  publishedReports
);

// =======================================================
// ORDER REPORT
// =======================================================

router.get(
  "/order/:orderId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    params: orderReportSchema,
  }),
  orderReport
);

// Stream Server-side NABL PDF
router.get(
  "/order/:orderId/pdf",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  orderReportPdf
);

// Preview Server-side NABL HTML
router.get(
  "/order/:orderId/html",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  getOrderReportHtmlPreview
);

// Download Server-side NABL PDF / HTML
router.get(
  "/order/:orderId/download",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  downloadOrderReportPdf
);

// (Moved GET /:id down below to avoid route conflict)

// =======================================================
// PATIENT REPORTS
// =======================================================

router.get(
  "/patient/:patientId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    params: patientReportSchema,
  }),
  patientReports
);

// =======================================================
// PREMIUM REPORT ACTIONS
// =======================================================

// Create Report Addendum
router.post(
  "/:id/addendum",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: addendumSchema,
  }),
  createAddendum
);

// Get Report Addendums
router.get(
  "/:id/addendums",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  getAddendums
);

// Apply Digital Signature
router.post(
  "/:id/signature",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: signatureSchema,
  }),
  applySignature
);

// Inline Approve Report
router.post(
  "/:id/approve-inline",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: inlineApproveSchema,
  }),
  inlineApprove
);

// Inline Reject Report
router.post(
  "/:id/reject-inline",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: inlineRejectSchema,
  }),
  inlineReject
);

// Generate Shareable Link
router.post(
  "/:id/share-link",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: shareLinkSchema,
  }),
  generateShareLink
);

// Validate Shareable Link (Public Access)
router.get(
  "/share/:token",
  validateShareLink
);

// Revoke Shareable Link
router.delete(
  "/share/:linkId",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  revokeShareLink
);

// Add to Patient History
router.post(
  "/:id/patient-history",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: patientHistorySchema,
  }),
  addToHistory
);

// Get Patient Timeline
router.get(
  "/patient/:patientId/timeline",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  patientTimeline
);

// =======================================================
// AMEND REPORT
// =======================================================

router.post(
  "/:id/amend",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: amendSchema,
  }),
  amendReportHandler
);

// =======================================================
// SEND REPORT TO REFERRING DOCTOR
// =======================================================

router.post(
  "/:id/send-doctor",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  validate({
    body: sendDoctorSchema,
  }),
  sendReportToDoctorHandler
);

// Stream Report PDF by report/order ID
router.get(
  "/:id/pdf",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  orderReportPdf
);

// Download Report PDF by report/order ID
router.get(
  "/:id/download",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  downloadOrderReportPdf
);

// Dispatch Report via WhatsApp
router.post(
  "/:id/send-whatsapp",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST
  ),
  sendReportWhatsAppHandler
);

// Dispatch Report via Email
router.post(
  "/:id/send-email",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.PATHOLOGIST
  ),
  sendReportEmailHandler
);

// Record Report Print
router.post(
  "/:id/print",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST
  ),
  printReportHandler
);

// =======================================================
// GET REPORT BY ID (MUST BE AT THE END)
// =======================================================

router.get(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.LAB_TECH,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = pathParam(req, "id");
      
      // Fetch the report by ID
      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          patient: true,
          order: {
            include: {
              doctor: true,
              items: {
                include: {
                  test: {
                    include: {
                      category: true,
                      parameters: {
                        include: {
                          referenceRanges: true,
                        },
                      },
                    },
                  },
                },
              },
              results: {
                where: {
                  status: "PUBLISHED",
                },
                include: {
                  test: true,
                  values: {
                    include: {
                      parameter: true,
                    },
                  },
                  enteredBy: {
                    select: {
                      id: true,
                      fullName: true,
                      employeeCode: true,
                    },
                  },
                  approvedBy: {
                    select: {
                      id: true,
                      fullName: true,
                      employeeCode: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
              invoice: true,
              payments: {
                orderBy: {
                  paidAt: "desc",
                },
              },
            },
          },
          publishedBy: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Report fetched successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;