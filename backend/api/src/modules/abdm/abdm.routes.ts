/**
 * ABDM Routes
 *
 * Two route groups:
 *  1. /api/abdm/* — User-facing routes, require authentication
 *  2. /v0.5/* — ABDM Gateway webhook routes, no auth (ABDM Gateway POSTs here)
 */

import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

import {
  getAbdmStatus,
  getAbdmStats,
  getAbdmTransactions,
  // ABHA Generation
  generateAadhaarOtp,
  verifyAadhaarOtpAndGenerate,
  generateMobileOtp,
  verifyMobileOtpAndGenerate,
  // ABHA Verification
  initAbhaAuth,
  confirmAbhaAuthHandler,
  // Patient Linking
  linkAbhaHandler,
  unlinkAbhaHandler,
  getAbhaCard,
  // Scan & Share
  generateQr,
  receiveSharedProfile,
  // FHIR & Care Contexts
  previewFhirBundle,
  addCareContext,
  listPatientConsents,
  listCareContexts,
  linkOrderToCareContext,
  bulkVerifyAbha,
  listAllConsents,
  createConsentRequest,
  fetchExternalPatientRecords,
  // Gateway Webhooks
  hipDiscover,
  hipLinkInit,
  hipLinkConfirm,
  hipConsentNotify,
  hipHealthInfoRequest,
} from "./abdm.controller";

// ─────────────────────────────────────────────────────────────
// User-facing Router
// ─────────────────────────────────────────────────────────────

const router = Router();

// Status & Stats
router.get("/status", getAbdmStatus);
router.get("/stats", getAbdmStats);
router.get("/transactions", getAbdmTransactions);

// ── ABHA Generation via Aadhaar OTP ──
router.post(
  "/abha/generate/aadhaar/otp",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  generateAadhaarOtp
);

router.post(
  "/abha/generate/aadhaar/verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  verifyAadhaarOtpAndGenerate
);

// ── ABHA Generation via Mobile OTP ──
router.post(
  "/abha/generate/mobile/otp",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  generateMobileOtp
);

router.post(
  "/abha/generate/mobile/verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  verifyMobileOtpAndGenerate
);

// ── ABHA Verification (existing ABHA holder) ──
router.post(
  "/abha/verify/init",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  initAbhaAuth
);

router.post(
  "/abha/verify/confirm",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  confirmAbhaAuthHandler
);

// ── Patient ABHA Linking ──
router.post(
  "/abha/link-patient",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  linkAbhaHandler
);

router.delete(
  "/abha/unlink/:patientId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  unlinkAbhaHandler
);

// ── ABHA Card ──
router.get(
  "/abha/card/:patientId",
  authenticate,
  getAbhaCard
);

// ── Scan & Share ──
router.post(
  "/scan-share/generate-qr",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  generateQr
);

router.post(
  "/scan-share/receive-profile",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  receiveSharedProfile
);

// ── FHIR Preview ──
router.get(
  "/fhir/preview/:orderId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.PATHOLOGIST),
  previewFhirBundle
);

// ── HIP Care Context (Admin adds manually) ──
router.post(
  "/care-context/add",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  addCareContext
);

// ── Consents for a patient ──
router.get(
  "/consents/:patientId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  listPatientConsents
);

// ── Enterprise Care Contexts ──
router.get(
  "/care-contexts",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK, UserRole.LAB_TECH),
  listCareContexts
);

router.post(
  "/care-contexts/link-order",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  linkOrderToCareContext
);

// ── Bulk ABHA Verification (Camps / Corporate) ──
router.post(
  "/bulk-verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  bulkVerifyAbha
);

// ── Consents (All Facility Consents & HIU Request) ──
router.get(
  "/consents",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  listAllConsents
);

router.post(
  "/consent/request",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  createConsentRequest
);

router.get(
  "/hiu/external-records/:consentId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.PATHOLOGIST),
  fetchExternalPatientRecords
);

// ─────────────────────────────────────────────────────────────
// ABDM Gateway Webhook Router (no authentication — open for ABDM Gateway)
// ─────────────────────────────────────────────────────────────
import { verifyAbdmGatewaySignature } from "./abdm.middleware";

export const abdmWebhookRouter = Router();
abdmWebhookRouter.use(verifyAbdmGatewaySignature);

// Care Context Discovery (ABDM Gateway → HIP)
abdmWebhookRouter.post("/care-contexts/discover", hipDiscover);

// Care Context Linking
abdmWebhookRouter.post("/links/link/init", hipLinkInit);
abdmWebhookRouter.post("/links/link/confirm", hipLinkConfirm);

// Consent Management
abdmWebhookRouter.post("/consents/hip/notify", hipConsentNotify);

// Health Data Transfer
abdmWebhookRouter.post("/health-information/hip/request", hipHealthInfoRequest);

export default router;
