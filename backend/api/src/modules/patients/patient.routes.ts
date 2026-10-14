import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";
import { UserRole } from "@prisma/client";

import {
  create,
  list,
  count,
  getOne,
  update,
  remove,
  createWithOrder,
  // Advanced features
  checkDuplicate,
  sendPhoneOTP,
  verifyPhone,
  sendEmailVerificationLink,
  verifyEmail,
  verifyKYC,
  getFamily,
  addToFamily,
  removeFromFamily,
  getAnalytics,
  getDemographics,
  getTopPatients,
  addHistory,
  getHistory,
  updateHistory,
  deleteHistory,
  addConsent,
  getConsents,
  revokePatientConsent,
  // Draft management
  saveDraft,
  listDrafts,
  getDraft,
  completeDraft,
  removeDraft,
  cleanupDrafts,
  getProgressStats,
  copyDraft,
} from "./patient.controller";

import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  patientQuerySchema,
  patientCountQuerySchema,
  patientHistoryParamsSchema,
  patientConsentParamsSchema,
  topPatientsQuerySchema,
  linkFamilySchema,
  medicalHistoryCreateSchema,
  medicalHistoryUpdateSchema,
  consentCreateSchema,
  createPatientWithOrderSchema,
  verifyPatientPhoneSchema,
  verifyPatientEmailSchema,
  checkDuplicateSchema,
  patientAnalyticsSchema,
  draftIdSchema,
  draftQuerySchema,
  saveDraftSchema,
  finalizeDraftSchema,
} from "./patient.validation";

const router = Router();

// Verify email must sit before authenticate: the patient follows this from an
// emailed link and only carries the token, never a bearer token.
router.post(
  "/verify/email",
  validate({ body: verifyPatientEmailSchema }),
  verifyEmail
);

// All patient routes require authentication
router.use(authenticate);

// ====================
// Draft Management
// ====================

const PATIENT_STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.FRONT_DESK,
  UserRole.LAB_TECH,
  UserRole.DOCTOR,
  UserRole.PATHOLOGIST,
];

// Save/update draft (auto-save)
router.post(
  "/drafts",
  authorize(...PATIENT_STAFF_ROLES),
  validate(saveDraftSchema),
  saveDraft
);

// List user drafts
router.get(
  "/drafts",
  authorize(...PATIENT_STAFF_ROLES),
  validate(draftQuerySchema),
  listDrafts
);

// Get form progress stats
router.get(
  "/drafts/stats",
  authorize(...PATIENT_STAFF_ROLES),
  getProgressStats
);

// Cleanup old drafts (Admin only)
router.post(
  "/drafts/cleanup",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  cleanupDrafts
);

// Get single draft
router.get(
  "/drafts/:id",
  authorize(...PATIENT_STAFF_ROLES),
  validate(draftIdSchema),
  getDraft
);

// Finalize draft to patient
router.post(
  "/drafts/:id/finalize",
  authorize(...PATIENT_STAFF_ROLES),
  validate(finalizeDraftSchema),
  completeDraft
);

// Duplicate draft
router.post(
  "/drafts/:id/duplicate",
  authorize(...PATIENT_STAFF_ROLES),
  validate(draftIdSchema),
  copyDraft
);

// Delete draft
router.delete(
  "/drafts/:id",
  authorize(...PATIENT_STAFF_ROLES),
  validate(draftIdSchema),
  removeDraft
);

// ====================
// Core Patient CRUD
// ====================

// Create Patient
router.post(
  "/",
  authorize(...PATIENT_STAFF_ROLES),
  validate(createPatientSchema),
  create
);

// Create Patient with Order
router.post(
  "/with-order",
  authorize(...PATIENT_STAFF_ROLES),
  validate(createPatientWithOrderSchema),
  createWithOrder
);

// Check for duplicate patients
router.get(
  "/check-duplicate",
  authorize(...PATIENT_STAFF_ROLES),
  validate(checkDuplicateSchema),
  checkDuplicate
);

// ====================
// Analytics & Reports
// ====================

// Get registration analytics - Admin only
router.get(
  "/analytics/registrations",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  validate(patientAnalyticsSchema),
  getAnalytics
);

// Get demographics - Admin only
router.get(
  "/analytics/demographics",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  getDemographics
);

// Get top patients by visits - Admin and Front Desk
router.get(
  "/analytics/top-patients",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRONT_DESK),
  validate(topPatientsQuerySchema),
  getTopPatients
);

// ====================
// List & Count
// ====================

// Bug Fix #12: Count route MUST come before /:id to prevent matching "count" as an ID
// Count Patients - All authenticated users
router.get(
  "/count",
  validate(patientCountQuerySchema),
  count
);

// List Patients - All authenticated users
router.get(
  "/",
  validate(patientQuerySchema),
  list
);

// ====================
// Individual Patient Operations
// ====================

// Get Patient - All authenticated users
router.get(
  "/:id",
  validate(patientIdSchema),
  getOne
);

// Update Patient - Staff roles
router.patch(
  "/:id",
  authorize(...PATIENT_STAFF_ROLES),
  validate(updatePatientSchema),
  update
);

// Delete Patient - Admin only
router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(patientIdSchema),
  remove
);

// ====================
// Verification Features
// ====================

// Send phone verification OTP
router.post(
  "/:id/verify/phone/send",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK),
  validate(patientIdSchema),
  sendPhoneOTP
);

// Verify phone OTP
router.post(
  "/:id/verify/phone",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK),
  validate(verifyPatientPhoneSchema),
  verifyPhone
);

// Send email verification
router.post(
  "/:id/verify/email/send",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK),
  validate(patientIdSchema),
  sendEmailVerificationLink
);

// Mark as KYC verified - Admin only
router.post(
  "/:id/verify/kyc",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(patientIdSchema),
  verifyKYC
);

// ====================
// Family Management
// ====================

// Get family members
router.get(
  "/:id/family",
  validate(patientIdSchema),
  getFamily
);

// Link to family
router.post(
  "/:id/family",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK),
  validate(linkFamilySchema),
  addToFamily
);

// Unlink from family
router.delete(
  "/:id/family",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK),
  validate(patientIdSchema),
  removeFromFamily
);

// ====================
// Medical History
// ====================

// Get medical history
router.get(
  "/:id/history",
  validate(patientIdSchema),
  getHistory
);

// Add medical history
router.post(
  "/:id/history",
  authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECH),
  validate(medicalHistoryCreateSchema),
  addHistory
);

// Update medical history
router.patch(
  "/:id/history/:historyId",
  authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECH),
  validate(medicalHistoryUpdateSchema),
  updateHistory
);

// Delete medical history
router.delete(
  "/:id/history/:historyId",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(patientHistoryParamsSchema),
  deleteHistory
);

// ====================
// Consent Management
// ====================

// Get patient consents
router.get(
  "/:id/consents",
  validate(patientIdSchema),
  getConsents
);

// Record consent
router.post(
  "/:id/consents",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FRONT_DESK, UserRole.DOCTOR),
  validate(consentCreateSchema),
  addConsent
);

// Revoke consent
router.delete(
  "/:id/consents/:consentId",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(patientConsentParamsSchema),
  revokePatientConsent
);

export default router;