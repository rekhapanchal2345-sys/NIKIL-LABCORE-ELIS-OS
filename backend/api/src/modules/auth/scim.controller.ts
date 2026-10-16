/**
 * Phase 4 — SCIM 2.0 Directory Sync Controller (RFC 7643 & RFC 7644)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implements standard SCIM 2.0 endpoints for IdP automated provisioning:
 *
 *   GET    /scim/v2/Users                  — search & list employees
 *   GET    /scim/v2/Users/:id              — retrieve user resource
 *   POST   /scim/v2/Users                  — provision employee (JIT from IdP)
 *   PUT    /scim/v2/Users/:id              — full replace employee profile
 *   PATCH  /scim/v2/Users/:id              — partial update (de-provisioning)
 *   DELETE /scim/v2/Users/:id              — deactivate employee & purge sessions
 *   GET    /scim/v2/ServiceProviderConfig  — IdP discovery endpoint
 *
 *   POST   /admin/scim/tokens              — mint IdP sync bearer token (ADMIN)
 *   GET    /admin/scim/tokens              — list active sync tokens
 *   DELETE /admin/scim/tokens/:id          — revoke sync token
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  verifyScimToken,
  getScimUsers,
  getScimUserById,
  createScimUser,
  updateScimUser,
  patchScimUser,
  deleteScimUser,
  getServiceProviderConfig,
  createScimToken,
  listScimTokens,
  revokeScimToken,
} from "./scim.service";
import { successResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";
import type { AuthUser } from "../../lib/auth";

const SCIM_JSON_CONTENT_TYPE = "application/scim+json";

const getUser = (req: Request): AuthUser => {
  const u = (req as AuthenticatedRequest).user;
  if (!u) throw new HttpError("Authentication required", 401, "UNAUTHENTICATED");
  return u;
};

/**
 * Middleware: Enforces SCIM 2.0 Bearer Token Authentication
 */
export async function authenticateScim(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const valid = await verifyScimToken(authHeader);

  if (!valid) {
    return res.status(401).setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: "Invalid, expired, or missing SCIM Bearer token",
      status: "401",
    });
  }

  next();
}

// ─── SCIM 2.0 Endpoints ───────────────────────────────────────────────────────

export const scimListUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startIndex = Number(req.query.startIndex || 1);
    const count = Number(req.query.count || 50);
    const filter = req.query.filter as string | undefined;
    const baseUrl = `${req.protocol}://${req.get("host")}/scim/v2`;

    const result = await getScimUsers({ startIndex, count, filter, baseUrl });
    res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const scimGetUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const baseUrl = `${req.protocol}://${req.get("host")}/scim/v2`;
    const user = await getScimUserById(id, baseUrl);
    res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const scimCreateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}/scim/v2`;
    const user = await createScimUser(req.body, baseUrl);
    res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const scimUpdateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const baseUrl = `${req.protocol}://${req.get("host")}/scim/v2`;
    const user = await updateScimUser(id, req.body, baseUrl);
    res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const scimPatchUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const baseUrl = `${req.protocol}://${req.get("host")}/scim/v2`;
    const user = await patchScimUser(id, req.body, baseUrl);
    res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const scimDeleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await deleteScimUser(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const scimConfigHandler = async (_req: Request, res: Response) => {
  const config = getServiceProviderConfig();
  res.setHeader("Content-Type", SCIM_JSON_CONTENT_TYPE).status(200).json(config);
};

// ─── Admin SCIM Token Management ──────────────────────────────────────────────

export const adminCreateScimTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = getUser(req);
    const { name } = req.body;
    const token = await createScimToken(name, admin.id);
    successResponse(res, token, "SCIM API Token generated", 201);
  } catch (err) {
    next(err);
  }
};

export const adminListScimTokensHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await listScimTokens();
    successResponse(res, tokens, "Active SCIM API Tokens");
  } catch (err) {
    next(err);
  }
};

export const adminRevokeScimTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = getUser(req);
    const id = String(req.params.id);
    const result = await revokeScimToken(id, admin.id);
    successResponse(res, result, "SCIM Token Revoked");
  } catch (err) {
    next(err);
  }
};
