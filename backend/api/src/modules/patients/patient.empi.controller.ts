/**
 * Enterprise EMPI Controller — HTTP handlers for all 7 elite capabilities
 */

import { Request, Response, NextFunction } from "express";
import {
  runEmpiMatch,
  computeAndSaveEmpiFields,
  resolveHouseholdGroup,
  getHouseholdMembers,
  upsertClinicalProfile,
  getClinicalProfile,
  mergePatients,
  unmergePatients,
  setConfidentialityLevel,
  breakGlassAccess,
  getPatientWithConfidentialityMask,
  handleAbdmScanShare,
  listEmpiReviewQueue,
  resolveEmpiReview,
} from "./patient.empi.service";
import { ConfidentialityLevel, FamilyRelation, PregnancyStatus } from "@prisma/client";

const ip = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "::1";

const param = (req: Request, key: string): string => {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val ?? "");
};

// ─── CAPABILITY 1: EMPI Match ────────────────────────────────────────────────

/**
 * POST /api/v1/patients/empi-match
 * Run probabilistic Fellegi-Sunter deduplication before patient creation.
 */
export const empiMatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await runEmpiMatch(req.body, req.query.excludeId as string | undefined);
    res.json({ matches: results, count: results.length });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/patients/:id/empi/reindex
 * Recompute phoneHash + phonetic codes for a patient (after name/phone edit).
 */
export const reindexEmpiFields = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = param(req, "id");
    const { phone, firstName, lastName } = req.body;
    const result = await computeAndSaveEmpiFields(id, { phone, firstName, lastName });
    res.json({ message: "EMPI fields reindexed", ...result });
  } catch (err) {
    next(err);
  }
};

// ─── CAPABILITY 2: Household Group ───────────────────────────────────────────

/**
 * POST /api/v1/patients/:id/household/resolve
 * Assign patient to an existing or new HouseholdGroup for their phone number.
 */
export const resolveHousehold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = param(req, "id");
    const { phone, relation } = req.body;
    const result = await resolveHouseholdGroup(phone, id, relation as FamilyRelation);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/patients/:id/household
 * List all members of this patient's household group.
 */
export const householdMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await getHouseholdMembers(param(req, "id"));
    res.json({ members, count: members.length });
  } catch (err) {
    next(err);
  }
};

// ─── CAPABILITY 3: Clinical Modifiers ────────────────────────────────────────

/**
 * GET /api/v1/patients/:id/clinical-profile
 * Fetch ISO 15189:2022 clinical modifiers (pregnancy, NICU, anticoagulants, etc.)
 */
export const getClinical = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = param(req, "id");
    const profile = await getClinicalProfile(patientId);
    res.json(profile ?? { patientId, message: "No clinical profile yet" });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/patients/:id/clinical-profile
 * Create or update clinical modifiers (upsert).
 */
export const upsertClinical = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await upsertClinicalProfile(param(req, "id"), {
      ...req.body,
      pregnancyStatus: req.body.pregnancyStatus as PregnancyStatus | undefined,
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

// ─── CAPABILITY 4: Merge / Unmerge ───────────────────────────────────────────

/**
 * POST /api/v1/patients/merge
 * Body: { sourcePatientId, targetPatientId, mergeReason }
 */
export const merge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourcePatientId, targetPatientId, mergeReason } = req.body;
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const result = await mergePatients(sourcePatientId, targetPatientId, actorId, mergeReason, ip(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/patients/merge/:mergeLogId/unmerge
 * SUPER_ADMIN only — reverses a previous merge using snapshot data.
 */
export const unmerge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const result = await unmergePatients(param(req, "mergeLogId"), actorId, ip(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─── CAPABILITY 5: Confidentiality / Break-Glass ─────────────────────────────

/**
 * PATCH /api/v1/patients/:id/confidentiality
 * Body: { level: 'STANDARD' | 'VIP_MASKED' | 'RESTRICTED_SENSITIVE' }
 */
export const setConfidentiality = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const result = await setConfidentialityLevel(
      param(req, "id"),
      req.body.level as ConfidentialityLevel,
      actorId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/patients/:id/break-glass
 * Body: { clinicalReason }
 * Opens a 30-minute unmasked access window and fires WebSocket alert.
 */
export const breakGlass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const result = await breakGlassAccess(param(req, "id"), actorId, req.body.clinicalReason, ip(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/patients/:id/confidential-view
 * Returns masked or full patient data based on active break-glass token.
 */
export const confidentialView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const patient = await getPatientWithConfidentialityMask(param(req, "id"), actorId);
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

// ─── CAPABILITY 6: ABDM Scan & Share ─────────────────────────────────────────

/**
 * POST /api/v1/patients/abdm-scan-share
 * ABDM gateway webhook: push verified patient data after QR Scan & Share.
 * Runs EMPI -> creates / routes patient in < 3 seconds.
 */
export const abdmScanShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "ABDM_GATEWAY";
    const result = await handleAbdmScanShare(req.body, actorId);
    res.status(result.action === "NEW_PATIENT" ? 201 : 200).json(result);
  } catch (err) {
    next(err);
  }
};

// ─── EMPI Review Queue ────────────────────────────────────────────────────────

/**
 * GET /api/v1/patients/empi/review-queue
 * Data Steward: list potential duplicates awaiting manual review.
 */
export const empiReviewQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const onlyUnresolved = req.query.resolved !== "true";
    const items = await listEmpiReviewQueue(onlyUnresolved);
    res.json({ items, count: items.length });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/patients/empi/review-queue/:reviewId/resolve
 * Body: { resolution: 'MERGE' | 'DISMISS', resolutionNotes? }
 */
export const resolveEmpiQueueItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as Request & { user?: { id: string } }).user?.id ?? "SYSTEM";
    const result = await resolveEmpiReview(
      param(req, "reviewId"),
      actorId,
      req.body.resolution,
      req.body.resolutionNotes
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
