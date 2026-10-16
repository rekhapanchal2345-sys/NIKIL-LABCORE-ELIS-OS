/**
 * Phase 3 — RBAC + ABAC Express Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Three middleware factories for route-level enforcement:
 *
 *   requirePermission(perm)
 *     → checks the user's EFFECTIVE permissions (role baseline + overrides)
 *     → supersedes the old static `hasPermission(role, perm)` checks
 *
 *   requireAbac(resourceType, action, resolveResourceId?, resolveAttributes?)
 *     → runs full ABAC policy evaluation
 *     → attaches `req.abacResult` for downstream handlers
 *
 *   requirePermissionAndAbac(perm, resourceType, action, ...)
 *     → RBAC gate first, then ABAC gate (cheaper to fail fast on RBAC)
 *
 * All checks are independently cacheable per-request (no DB double-hits).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";
import { userHasPermission } from "../modules/auth/rbac.service";
import { assertAbacPermit, type ResourceType } from "../modules/auth/abac.engine";
import type { AuthenticatedRequest } from "../../middleware/auth";
import type { Permission } from "../lib/permissions";

// ─── requirePermission ────────────────────────────────────────────────────────

/**
 * Middleware: verify the authenticated user holds the given permission
 * in their EFFECTIVE permission set (role + overrides).
 *
 * Usage:
 *   router.get("/patients/:id", authenticate, requirePermission("patient:read"), handler)
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user?.id) {
        return next(new HttpError("Authentication required", 401, "UNAUTHENTICATED"));
      }

      const allowed = await userHasPermission(user.id, permission);
      if (!allowed) {
        return next(
          new HttpError(
            `Permission denied: ${permission}`,
            403,
            "PERMISSION_DENIED"
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── requireAbac ──────────────────────────────────────────────────────────────

type ResourceIdResolver = (req: Request) => string | undefined;
type AttributesResolver = (req: Request) => Record<string, unknown>;

/**
 * Middleware: run full ABAC policy evaluation for a route.
 *
 * Usage:
 *   router.get(
 *     "/patients/:id",
 *     authenticate,
 *     requireAbac("patient", "read", (req) => req.params.id),
 *     handler
 *   )
 */
export function requireAbac(
  resourceType: ResourceType,
  action: "read" | "create" | "update" | "delete" | "export" | "approve" | "print",
  resolveResourceId?: ResourceIdResolver,
  resolveAttributes?: AttributesResolver
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user?.id) {
        return next(new HttpError("Authentication required", 401, "UNAUTHENTICATED"));
      }

      const resourceId = resolveResourceId?.(req);
      const attributes = resolveAttributes?.(req) ?? {};

      // Attach step-up token from header if present
      const stepUpToken = req.headers["x-step-up-token"] as string | undefined;
      if (stepUpToken) attributes["stepUpToken"] = stepUpToken;

      const abacResult = await assertAbacPermit({
        userId: user.id,
        userRole: user.role as any,
        resourceType,
        resourceId,
        action,
        attributes,
      });

      // Attach to request for downstream use
      (req as any).abacResult = abacResult;

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── requirePermissionAndAbac ─────────────────────────────────────────────────

/**
 * Combined RBAC + ABAC gate.
 * RBAC check runs first (cheaper), ABAC only if RBAC passes.
 *
 * Usage:
 *   router.get(
 *     "/results/:id/approve",
 *     authenticate,
 *     requirePermissionAndAbac(
 *       "result:approve", "result", "approve",
 *       (req) => req.params.id
 *     ),
 *     handler
 *   )
 */
export function requirePermissionAndAbac(
  permission: Permission,
  resourceType: ResourceType,
  action: "read" | "create" | "update" | "delete" | "export" | "approve" | "print",
  resolveResourceId?: ResourceIdResolver,
  resolveAttributes?: AttributesResolver
) {
  const rbacMw = requirePermission(permission);
  const abacMw = requireAbac(resourceType, action, resolveResourceId, resolveAttributes);

  return [rbacMw, abacMw];
}
