/**
 * Phase 4 — Clinical Break-Glass Emergency Access Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REST Endpoints for Healthcare Emergency Access Governance:
 *
 *   POST /auth/break-glass/initiate      — invoke emergency override (DOCTOR/PATHOLOGIST)
 *   POST /auth/break-glass/validate      — test/validate emergency token
 *   POST /auth/break-glass/review/:id    — clinical compliance review (ADMIN/AUDITOR)
 *   POST /auth/break-glass/revoke/:id    — revoke active emergency session early
 *   GET  /auth/break-glass/active        — live active emergency sessions
 *   GET  /auth/break-glass/history       — historical audit trail with pagination
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  initiateBreakGlass,
  validateBreakGlassToken,
  reviewBreakGlassEvent,
  revokeBreakGlassEvent,
  listActiveBreakGlassEvents,
  listBreakGlassHistory,
} from "./break-glass.service";
import { successResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import { getClientIp } from "../../utils/request-meta";
import type { AuthenticatedRequest } from "../../../middleware/auth";
import type { AuthUser } from "../../lib/auth";

const getUser = (req: Request): AuthUser => {
  const u = (req as AuthenticatedRequest).user;
  if (!u) throw new HttpError("Authentication required", 401, "UNAUTHENTICATED");
  return u;
};

export const initiateBreakGlassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const { targetResourceType, targetResourceId, reason, durationMinutes } = req.body;

    const result = await initiateBreakGlass({
      userId: user.id,
      targetResourceType,
      targetResourceId,
      reason,
      durationMinutes,
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    successResponse(res, result, "Emergency Break-Glass Access Granted", 201);
  } catch (err) {
    next(err);
  }
};

export const validateBreakGlassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, resourceType, resourceId } = req.body;
    const result = await validateBreakGlassToken(token, resourceType, resourceId);
    successResponse(res, result, "Break-Glass Token Validation");
  } catch (err) {
    next(err);
  }
};

export const reviewBreakGlassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviewer = getUser(req);
    const eventId = String(req.params.id);
    const { reviewNotes, approved } = req.body;

    const result = await reviewBreakGlassEvent({
      eventId,
      reviewerId: reviewer.id,
      reviewNotes,
      approved,
      ipAddress: getClientIp(req),
    });

    successResponse(res, result, "Break-Glass Event Reviewed");
  } catch (err) {
    next(err);
  }
};

export const revokeBreakGlassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const eventId = String(req.params.id);
    const reason = String(req.body?.reason || "Revoked by administrator");

    const result = await revokeBreakGlassEvent(
      eventId,
      user.id,
      reason,
      getClientIp(req)
    );

    successResponse(res, result, "Break-Glass Access Revoked");
  } catch (err) {
    next(err);
  }
};

export const listActiveBreakGlassHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const active = await listActiveBreakGlassEvents();
    successResponse(res, active, "Active Break-Glass Sessions");
  } catch (err) {
    next(err);
  }
};

export const listBreakGlassHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const status = req.query.status as string | undefined;

    const history = await listBreakGlassHistory({ page, limit, status });
    successResponse(res, history, "Break-Glass Audit History");
  } catch (err) {
    next(err);
  }
};
