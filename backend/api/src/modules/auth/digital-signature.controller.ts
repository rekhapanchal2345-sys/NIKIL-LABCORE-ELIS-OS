/**
 * Phase 5 — FDA 21 CFR Part 11 Digital Signature Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REST Endpoints for Clinical Electronic Signatures & Non-Repudiation:
 *
 *   POST /auth/signatures/sign                 — apply Part 11 digital signature
 *   POST /auth/signatures/verify/:id           — verify signature & tamper state
 *   GET  /auth/signatures/resource/:type/:id   — retrieve clinical signature chain
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  createDigitalSignature,
  verifyDigitalSignature,
  listSignaturesForResource,
} from "./digital-signature.service";
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

export const createSignatureHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getUser(req);
    const {
      password,
      stepUpToken,
      resourceType,
      resourceId,
      meaning,
      reason,
      payload,
    } = req.body;

    const signature = await createDigitalSignature({
      userId: user.id,
      password,
      stepUpToken,
      resourceType,
      resourceId,
      meaning,
      reason,
      payload,
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    successResponse(res, signature, "Digital signature applied successfully (Part 11 Compliant)", 201);
  } catch (err) {
    next(err);
  }
};

export const verifySignatureHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const { currentPayload } = req.body || {};

    const verification = await verifyDigitalSignature(id, currentPayload);
    successResponse(res, verification, "Signature Verification Result");
  } catch (err) {
    next(err);
  }
};

export const listResourceSignaturesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resourceType = String(req.params.type);
    const resourceId = String(req.params.id);

    const signatures = await listSignaturesForResource(resourceType, resourceId);
    successResponse(res, signatures, "Resource Signatures");
  } catch (err) {
    next(err);
  }
};
