import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";
import type { AuthenticatedRequest } from "../../middleware/auth";
import prisma from "../../config/database";

declare global {
  namespace Express {
    interface Request {
      branchId?: string | null;
      branchCode?: string | null;
      isGlobalBranchAccess?: boolean;
    }
  }
}

/**
 * Branch context injection middleware.
 *
 * Enforces tenant data isolation across branches:
 * - SUPER_ADMIN / ADMIN have cross-branch visibility. They can explicitly select a branch via `x-branch-id` header or view all.
 * - Other roles are strictly restricted to their assigned branch.
 */
export async function branchContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    // Default: no branch specified
    req.branchId = null;
    req.branchCode = null;
    req.isGlobalBranchAccess = false;

    // If request is unauthenticated (e.g. public webhook), continue
    if (!user) {
      return next();
    }

    const requestedBranchId =
      (req.headers["x-branch-id"] as string) ||
      (req.query.branchId as string) ||
      null;

    const isHqAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    if (isHqAdmin) {
      if (requestedBranchId) {
        // Verify branch exists and is active
        const branch = await prisma.branch.findUnique({
          where: { id: requestedBranchId },
        });

        if (!branch) {
          return next(new HttpError(404, `Target branch "${requestedBranchId}" not found.`));
        }

        req.branchId = branch.id;
        req.branchCode = branch.code;
        req.isGlobalBranchAccess = false;
      } else {
        // Global aggregate access
        req.branchId = null;
        req.branchCode = "HQ_GLOBAL";
        req.isGlobalBranchAccess = true;
      }
      return next();
    }

    // For branch staff:
    const assignedBranchId = user.branchId;

    if (!assignedBranchId) {
      // User has no branch assigned - fallback to main branch if one exists
      const mainBranch = await prisma.branch.findFirst({
        where: { isMainBranch: true, isActive: true },
      });
      req.branchId = mainBranch?.id || null;
      req.branchCode = mainBranch?.code || null;
      req.isGlobalBranchAccess = false;
      return next();
    }

    // If branch staff requested a branch different from their assigned branch, block it
    if (requestedBranchId && requestedBranchId !== assignedBranchId) {
      return next(
        new HttpError(
          403,
          "Access denied: You are not authorized to access data for another branch.",
          "BRANCH_ACCESS_DENIED"
        )
      );
    }

    req.branchId = assignedBranchId;
    req.isGlobalBranchAccess = false;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Helper to build Prisma where clause for branch isolation
 */
export function scopeBranchQuery(
  req: Request,
  customCondition?: Record<string, any>
): Record<string, any> {
  if (req.isGlobalBranchAccess && !req.branchId) {
    return customCondition || {};
  }

  if (req.branchId) {
    return {
      ...(customCondition || {}),
      branchId: req.branchId,
    };
  }

  return customCondition || {};
}

/**
 * Validates whether the current actor is permitted to read or mutate a resource with the given branchId
 */
export function validateBranchAccess(
  userRole: string,
  userBranchId: string | null | undefined,
  targetBranchId: string | null | undefined
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return true;
  }

  if (!userBranchId || !targetBranchId) {
    return false;
  }

  return userBranchId === targetBranchId;
}
