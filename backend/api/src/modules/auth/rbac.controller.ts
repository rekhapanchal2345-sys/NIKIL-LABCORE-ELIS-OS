/**
 * Phase 3 — RBAC / ABAC Admin Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REST handlers for the Enterprise Permission Management UI:
 *
 *   GET  /admin/rbac/matrix               — full user × permission matrix
 *   GET  /admin/rbac/users/:id/permissions — effective permissions for user
 *   GET  /admin/rbac/users/:id/overrides   — list current overrides for user
 *   POST /admin/rbac/users/:id/grant       — grant a permission to user
 *   POST /admin/rbac/users/:id/deny        — add a deny override to user
 *   DELETE /admin/rbac/overrides/:id       — revoke a specific override
 *
 *   GET  /admin/rbac/users/:id/role-overrides  — list active role overrides
 *   POST /admin/rbac/users/:id/role-overrides  — assign temporary role
 *   DELETE /admin/rbac/role-overrides/:id      — revoke role override
 *
 *   GET  /admin/abac/policies              — list all ABAC policies
 *   POST /admin/abac/evaluate              — dry-run ABAC evaluation (no side effects)
 *
 * All endpoints require SUPER_ADMIN or ADMIN role + step-up token.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Request, Response, NextFunction } from "express";
import { getClientIp } from "../../utils/request-meta";
import {
  getEffectivePermissions,
  listPermissionOverrides,
  grantPermission,
  denyPermission,
  revokePermissionOverride,
  assignRoleOverride,
  revokeRoleOverride,
  listActiveRoleOverrides,
  getPermissionMatrix,
} from "./rbac.service";
import { evaluateAbac, listAbacPolicies } from "./abac.engine";
import { successResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";
import type { AuthUser, UserRole } from "../../lib/auth";

const getUser = (req: Request): AuthUser => {
  const u = (req as AuthenticatedRequest).user;
  if (!u) throw new HttpError("Authentication required", 401, "UNAUTHENTICATED");
  return u;
};

// ─── Permission Matrix ────────────────────────────────────────────────────────

export const permissionMatrixHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const matrix = await getPermissionMatrix();
    successResponse(res, matrix, "Permission matrix");
  } catch (err) {
    next(err);
  }
};

// ─── Effective Permissions For User ──────────────────────────────────────────

export const effectivePermissionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const ep = await getEffectivePermissions(id);
    successResponse(res, ep, "Effective permissions");
  } catch (err) {
    next(err);
  }
};

// ─── List Overrides For User ──────────────────────────────────────────────────

export const listOverridesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const overrides = await listPermissionOverrides(id);
    successResponse(res, overrides, "Permission overrides");
  } catch (err) {
    next(err);
  }
};

// ─── Grant Permission ─────────────────────────────────────────────────────────

export const grantPermissionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const targetUserId = String(req.params.id);
    const { permission, reason, expiresAt } = req.body;

    const override = await grantPermission({
      adminId: admin.id,
      targetUserId,
      permission,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      ipAddress: getClientIp(req),
    });

    successResponse(res, override, "Permission granted");
  } catch (err) {
    next(err);
  }
};

// ─── Deny Permission ──────────────────────────────────────────────────────────

export const denyPermissionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const targetUserId = String(req.params.id);
    const { permission, reason, expiresAt } = req.body;

    const override = await denyPermission({
      adminId: admin.id,
      targetUserId,
      permission,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      ipAddress: getClientIp(req),
    });

    successResponse(res, override, "Permission denied override applied");
  } catch (err) {
    next(err);
  }
};

// ─── Revoke Override ──────────────────────────────────────────────────────────

export const revokeOverrideHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const overrideId = String(req.params.id);

    await revokePermissionOverride({
      adminId: admin.id,
      overrideId,
      ipAddress: getClientIp(req),
    });

    successResponse(res, null, "Permission override revoked");
  } catch (err) {
    next(err);
  }
};

// ─── Role Overrides ───────────────────────────────────────────────────────────

export const listRoleOverridesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const overrides = await listActiveRoleOverrides(id);
    successResponse(res, overrides, "Active role overrides");
  } catch (err) {
    next(err);
  }
};

export const assignRoleOverrideHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const targetUserId = String(req.params.id);
    const { overrideRole, reason, validFrom, validUntil } = req.body;

    const override = await assignRoleOverride({
      adminId: admin.id,
      targetUserId,
      overrideRole: overrideRole as UserRole,
      reason,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      ipAddress: getClientIp(req),
    });

    successResponse(res, override, "Role override assigned");
  } catch (err) {
    next(err);
  }
};

export const revokeRoleOverrideHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const overrideId = String(req.params.id);

    await revokeRoleOverride({
      adminId: admin.id,
      overrideId,
      ipAddress: getClientIp(req),
    });

    successResponse(res, null, "Role override revoked");
  } catch (err) {
    next(err);
  }
};

// ─── ABAC Endpoints ───────────────────────────────────────────────────────────

export const abacPoliciesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policies = listAbacPolicies();
    successResponse(res, policies, "ABAC policies");
  } catch (err) {
    next(err);
  }
};

export const abacEvaluateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, userRole, resourceType, resourceId, action, attributes } = req.body;
    const result = await evaluateAbac({
      userId,
      userRole,
      resourceType,
      resourceId,
      action,
      attributes,
    });
    successResponse(res, result, "ABAC evaluation result");
  } catch (err) {
    next(err);
  }
};
