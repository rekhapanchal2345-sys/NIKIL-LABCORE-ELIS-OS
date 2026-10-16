/**
 * Phase 5 — OAuth2 Machine-to-Machine Gateway Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implements RFC 6749 OAuth 2.0 Client Credentials Grant & Client Management:
 *
 *   POST /oauth/v2/token                      — OAuth2 client_credentials token endpoint
 *   GET  /admin/m2m/clients                   — list registered M2M clients (ADMIN)
 *   POST /admin/m2m/clients                   — register new instrument / EMR bridge
 *   POST /admin/m2m/clients/:clientId/rotate  — emergency secret rotation
 *   DELETE /admin/m2m/clients/:id             — revoke M2M client
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  exchangeClientCredentials,
  createApiClient,
  listApiClients,
  rotateApiClientSecret,
  deleteApiClient,
} from "./m2m-gateway.service";
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

// ─── OAuth 2.0 Token Endpoint (RFC 6749) ──────────────────────────────────────

export const oauthTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const grantType = req.body?.grant_type || req.query?.grant_type;
    if (grantType !== "client_credentials") {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only grant_type=client_credentials is supported on this endpoint",
      });
    }

    // Support credentials in HTTP Basic Auth header or body
    let clientId = req.body?.client_id;
    let clientSecret = req.body?.client_secret;

    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const [u, p] = decoded.split(":");
      clientId = u;
      clientSecret = p;
    }

    const scope = req.body?.scope as string | undefined;

    const tokenRes = await exchangeClientCredentials({
      clientId,
      clientSecret,
      scope,
      ipAddress: getClientIp(req),
    });

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.status(200).json(tokenRes);
  } catch (err) {
    next(err);
  }
};

// ─── Admin API Client Management ──────────────────────────────────────────────

export const createApiClientHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const { name, scopes, ipWhitelist, rateLimit, expiresInDays } = req.body;

    const client = await createApiClient({
      name,
      scopes,
      ipWhitelist,
      rateLimit,
      expiresInDays,
      createdById: admin.id,
    });

    successResponse(res, client, "M2M API Client registered", 201);
  } catch (err) {
    next(err);
  }
};

export const listApiClientsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clients = await listApiClients();
    successResponse(res, clients, "Active M2M API Clients");
  } catch (err) {
    next(err);
  }
};

export const rotateClientSecretHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const clientId = String(req.params.clientId);

    const result = await rotateApiClientSecret(clientId, admin.id);
    successResponse(res, result, "Client Secret Rotated");
  } catch (err) {
    next(err);
  }
};

export const deleteApiClientHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const id = String(req.params.id);

    const result = await deleteApiClient(id, admin.id);
    successResponse(res, result, "API Client Revoked");
  } catch (err) {
    next(err);
  }
};
