/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — ENTERPRISE RBAC AUTHORIZATION MIDDLEWARE (DAY 25)
 * ═══════════════════════════════════════════════════════════════════════════
 * Strict role-based & permission-based access control guards for Express routes.
 *
 * Prevents horizontal and vertical privilege escalation across hospital domains.
 * Returns structured HTTP 401 (Unauthenticated) & HTTP 403 (Forbidden) payloads.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";
import {
  normalizeRole,
  isRoleAuthorized,
  canRolePerform,
  ROLE_HIERARCHY,
  type SystemModule,
  type ModuleAction,
} from "../modules/auth/rbac-matrix";
import { userHasPermission } from "../modules/auth/rbac.service";
import type { Permission } from "../lib/permissions";
import type { UserRole } from "../lib/auth";

export interface AuthenticatedUser {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
  branchId?: string | null;
}

export interface RbacRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware: Enforces that the authenticated user possesses one of the allowed roles.
 * Supports role aliases (e.g., RECEPTIONIST <-> FRONT_DESK).
 * SUPER_ADMIN is granted unrestricted bypass across all role gates.
 *
 * Usage:
 *   router.post("/approvals/batch", authenticate, requireRole("PATHOLOGIST"), handler);
 */
export function requireRole(...allowedRoles: (UserRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as RbacRequest).user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const stringRoles = allowedRoles.map((r) => String(r));
      const authorized = isRoleAuthorized(user.role, stringRoles);

      if (!authorized) {
        res.status(403).json({
          success: false,
          error: `Access denied: role '${user.role}' is not authorized for this action`,
          code: "FORBIDDEN",
          userRole: user.role,
          requiredRoles: allowedRoles,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Enforces that the user has a specific permission in their effective
 * permission set (accounting for role baseline, grants, and explicit denies).
 *
 * Usage:
 *   router.post("/samples/collect", authenticate, requirePermission("sample:collect"), handler);
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as RbacRequest).user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      // SUPER_ADMIN has full permissions
      const normRole = normalizeRole(user.role);
      if (normRole === "SUPER_ADMIN") {
        return next();
      }

      for (const perm of permissions) {
        const allowed = await userHasPermission(user.id, perm);
        if (!allowed) {
          res.status(403).json({
            success: false,
            error: `Permission denied: missing required permission '${perm}'`,
            code: "PERMISSION_DENIED",
            userRole: user.role,
            requiredPermission: perm,
          });
          return;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Enforces granular module-action permissions using the hospital matrix.
 *
 * Usage:
 *   router.post("/results/:id/approve", authenticate, requireModuleAction("results", "approve"), handler);
 */
export function requireModuleAction(module: SystemModule, action: ModuleAction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as RbacRequest).user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const permitted = canRolePerform(user.role, module, action);
      if (!permitted) {
        res.status(403).json({
          success: false,
          error: `Action '${action}' on module '${module}' is forbidden for role '${user.role}'`,
          code: "ACTION_FORBIDDEN",
          module,
          action,
          userRole: user.role,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Enforces minimum hierarchical authority rank.
 */
export function requireMinimumHierarchy(minRole: UserRole | string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as RbacRequest).user;
      if (!user || !user.id) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const userRank = ROLE_HIERARCHY[normalizeRole(user.role)] ?? 0;
      const minRank = ROLE_HIERARCHY[normalizeRole(minRole)] ?? 0;

      if (userRank < minRank) {
        res.status(403).json({
          success: false,
          error: `Access denied: requires minimum role rank of '${minRole}' (tier ${minRank}), current is tier ${userRank}`,
          code: "HIERARCHY_FORBIDDEN",
          userRole: user.role,
          requiredTier: minRank,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
